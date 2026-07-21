# 09 — Capa de aplicación (la parte dinámica)

La base (VPC de 3 capas, RDS privado, tags, state, seguridad) es **igual en todo
proyecto**. Lo que cambia entre proyectos —y puede cambiar dentro de un mismo
proyecto con el tiempo— es **cómo corre el código de la aplicación**: Lambda hoy,
Fargate mañana, EC2 o EKS en otro. Esta regla define el contrato que cualquier
capa de aplicación debe cumplir para enchufarse sobre la base común.

## El contrato: qué debe cumplir CUALQUIER capa de app

Sin importar el runtime elegido, la capa de aplicación:

1. **Corre en la capa `private`** (nunca `public`). El acceso público entra por
   el borde (ALB/CloudFront), no por el compute.
2. **Tiene su propio SG** (`{prefix}-app-sg` o `{prefix}-<servicio>-sg`).
3. **Alcanza los datos por SG-ref**: su SG es el `allowed_security_group_id` /
   `app_sg_id` que consumen los módulos de datos (RDS Proxy, ElastiCache).
   Nunca se conecta a la instancia RDS directamente — siempre al **proxy/endpoint**.
4. **Lee configuración sensible desde Secrets Manager** con un rol IAM scopeado
   al ARN del secreto (regla 08), no desde variables de entorno en claro.
5. **Sale a internet por NAT** (pulls de imágenes/paquetes, APIs de AWS), sin
   ruta de entrada desde internet.
6. Se **cablea en el `main.tf` del entorno**, pasando los outputs de la base
   (`module.vpc.private_subnet_ids`, `module.rds_proxy.proxy_endpoint`, el SG).

Mientras se cumpla este contrato, el runtime es intercambiable.

## Cómo elegir el runtime

| Necesidad | Runtime | Módulo(s) típicos |
|-----------|---------|-------------------|
| Event-driven, ráfagas, escala a cero, poca gestión | **Lambda** (serverless) | SG de lambda (glue) + funciones (fuera de IaC o módulo `lambda`) |
| Servicio HTTP de larga duración, contenedores, sin gestionar servidores | **Fargate** | `ecs` + `alb` + `security-groups` |
| Control del SO / cargas especiales / software legacy | **EC2 / ASG** | `ec2-asg` + `alb` |
| Orquestación de contenedores compleja, multi-servicio | **EKS** | `eks` + `alb` (controller) |

> Si el usuario no lo especifica, **pregunta** qué runtime antes de generar. No
> asumas Lambda solo porque el proyecto de referencia lo use.

## Patrón A — Serverless (Lambda)

La(s) función(es) suelen crearse fuera de este IaC (o en un módulo `lambda`), pero
la infraestructura que necesitan se define aquí. El "compute SG" es un recurso de
glue en `main.tf` con **solo egress**; el ingress al proxy lo concede el proxy
referenciando este SG.

```hcl
# Glue en main.tf: SG de las Lambdas en la VPC (solo egress).
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-${var.environment}-lambda-sg"
  description = "Serverless functions: outbound to RDS Proxy and AWS APIs."
  vpc_id      = module.vpc.vpc_id
  tags        = merge(var.tags, { Name = "${var.project_name}-${var.environment}-lambda-sg" })
}

resource "aws_vpc_security_group_egress_rule" "lambda_all" {
  security_group_id = aws_security_group.lambda.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "Outbound to RDS Proxy, Secrets Manager, SNS, etc."
}

# El proxy acepta a este SG (el módulo de datos consume el SG de la app).
module "rds_proxy" {
  source                     = "../../modules/rds-proxy"
  # ...
  allowed_security_group_ids = [aws_security_group.lambda.id]
}
```

Las Lambdas se despliegan en `module.vpc.private_subnet_ids` con `aws_security_group.lambda.id`.

## Patrón B — Contenedores (Fargate)

El borde es un ALB en la capa `public`; el servicio corre en `private`. El módulo
`security-groups` modela la cadena ALB→ECS y el módulo `rds`/`rds-proxy` acepta el
SG de ECS.

```hcl
module "security_groups" { source = "../../modules/security-groups"; vpc_id = module.vpc.vpc_id; container_port = var.container_port; /* ... */ }
module "alb"             { source = "../../modules/alb"; subnets = module.vpc.public_subnet_ids;  security_group_id = module.security_groups.alb_sg_id; /* ... */ }
module "ecs"             { source = "../../modules/ecs"; subnets = module.vpc.private_subnet_ids; security_group_id = module.security_groups.ecs_sg_id; /* ... */ }

# Los datos aceptan al SG del compute — mismo contrato que en serverless.
module "rds_proxy" { source = "../../modules/rds-proxy"; allowed_security_group_ids = [module.security_groups.ecs_sg_id]; /* ... */ }
```

Dos roles IAM en el módulo de contenedores (regla 08): *execution role* (pull de
ECR + logs) y *task role* (runtime, arranca vacío; se le adjuntan permisos por
caso de uso con `aws_iam_role_policy_attachment` en `main.tf`).

## Cómo el compute consume config y secretos

Sea cual sea el runtime, la configuración se **cablea desde los outputs de los
módulos en `main.tf`**, no se hardcodea. Separa siempre config **no sensible**
(env vars en claro) de **secretos** (referencia a Secrets Manager, nunca el valor).

**Secretos → referencia por clave JSON, no el valor.** Fargate usa el bloque
`secrets` de la task definition con `valueFrom = "<secret-arn>:<json-key>::"`;
Lambda lee el secreto con el SDK en runtime. El ARN **solo se conoce tras apply**,
por eso la lista se arma con `locals` en `main.tf`, no en `terraform.tfvars`:

```hcl
locals {
  # Una entrada por clave del secreto JSON del RDS (ARN conocido post-apply).
  rds_secrets = [
    { name = "DB_HOST",     valueFrom = "${module.rds.db_secret_arn}:host::" },
    { name = "DB_PASSWORD", valueFrom = "${module.rds.db_secret_arn}:password::" },
    # ...
  ]
}
```

**Concatena las fuentes de secretos** — administrados por el módulo `secrets`,
auto-cableados de la capa de datos, y externos referenciados por ARN:

```hcl
secrets = concat(
  local.rds_secrets,          # de module.rds (post-apply)
  local.redis_secrets,        # de module.elasticache (post-apply)
  module.secrets.ecs_secrets, # secretos administrados por el módulo secrets
  var.ecs_secrets,            # secretos externos, por ARN, desde tfvars
)
```

**Config no sensible derivada de outputs** — para que nunca haga drift respecto a
lo desplegado (dominio de CloudFront, nombre de bucket):

```hcl
locals {
  assets_env = [
    { name = "ASSETS_CDN_BASE_URL",       value = "https://${module.s3_cdn.cloudfront_domain_name}" },
    { name = "AWS_S3_ASSETS_BUCKET_NAME", value = module.s3_cdn.bucket_id },
  ]
}
environment_variables = concat(local.assets_env, var.ecs_environment_variables)
```

**Permisos por caso de uso al rol de runtime** — el task/execution role arranca
vacío; se le adjuntan permisos en `main.tf` como glue (regla 02/08):

```hcl
resource "aws_iam_role_policy_attachment" "ecs_task_s3" {
  role       = module.ecs.task_role_name
  policy_arn = module.s3_cdn.task_s3_policy_arn
}
```

## Migrar de un runtime a otro (Lambda ↔ Fargate)

Como la base cumple un contrato estable, migrar significa:

1. Añadir el/los módulo(s) del nuevo runtime (`ecs`+`alb`, o el `lambda` SG).
2. Reemplazar el SG que se pasa como `allowed_security_group_ids` a los módulos de
   datos por el SG del nuevo compute.
3. Cablear el borde nuevo (ALB) si aplica.
4. Retirar el glue del runtime viejo.

La VPC, subnets, RDS, RDS Proxy, secretos, tags y state **no cambian**.

## Anti-patrones

```hcl
# ❌ Compute en subnet pública "para exponerlo": el borde es ALB/CloudFront, no el compute
subnets = module.vpc.public_subnet_ids   # para Fargate/EC2/Lambda de app: usa private

# ❌ App conectando directo a la instancia RDS en vez del proxy/endpoint
DB_HOST = module.rds.db_instance_endpoint   # usa module.rds_proxy.proxy_endpoint

# ❌ Meter la lógica del runtime dentro del módulo VPC/RDS
#    (la base es agnóstica al runtime; el runtime se cablea en main.tf)

# ❌ Credenciales de DB como variables de entorno en claro
environment = { DB_PASSWORD = var.db_password }   # usa Secrets Manager + IAM
```
