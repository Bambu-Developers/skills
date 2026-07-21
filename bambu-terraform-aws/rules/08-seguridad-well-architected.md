# 08 — Seguridad y Well-Architected (baseline no negociable)

Este baseline aplica a **todo** proyecto y a **toda** capa de aplicación. Son los
mínimos; un módulo que no los cumpla no se considera terminado. Se alinea con los
pilares de Seguridad, Confiabilidad y Optimización de costos del AWS
Well-Architected Framework.

## 1. Red privada por defecto

- Cómputo de aplicación y datos viven en subnets `private`/`data`, **nunca**
  `public` (regla 06). Lo único público es el borde (ALB/CloudFront/bastion).
- Almacenes de datos: `publicly_accessible = false`, sin ruta de entrada desde
  internet, alcanzables solo por SG-ref desde la app (regla 07).
- Exposición a internet siempre a través de un borde controlado (ALB + WAF,
  o CloudFront con OAC), nunca exponiendo el compute o el bucket directamente.

## 2. Cifrado en reposo — siempre

```hcl
# RDS / Aurora
storage_encrypted = true
storage_type      = "gp3"

# S3
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}
```

Aplica también a ElastiCache (`at_rest_encryption_enabled`), EBS y el bucket de
state. Cifrado en tránsito (TLS) donde el servicio lo soporte (`require_tls` en
RDS Proxy, `transit_encryption_enabled` en ElastiCache, `redirect-to-https` en
CloudFront).

## 3. S3 — bloqueo de acceso público obligatorio

Todo bucket lleva su `aws_s3_bucket_public_access_block` con los cuatro flags en
`true`. El acceso se concede por **policy dirigida a un principal/servicio**, no
abriendo el bucket:

```hcl
resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

Para servir assets públicos: **CloudFront + OAC** con la bucket policy scopeada al
principal `cloudfront.amazonaws.com` y condición `AWS:SourceArn` a esa
distribución — el bucket permanece privado. Aísla lo sensible por prefijo
(`origin_path = "/public"` + policy scopeada a `arn/public/*`), de modo que el
prefijo privado sea inalcanzable por la CDN.

## 4. Secretos — nunca en código ni en variables

- Las credenciales se **generan** (`random_password`) y se guardan en **Secrets
  Manager**; nunca se hardcodean ni se pasan por `terraform.tfvars`.
- Guarda el secreto como JSON (host, port, dbname, username, password) para que
  el consumidor referencie claves individuales.
- Excluye caracteres que rompen connection strings al generar la contraseña
  (`@`, `/`, `"`, espacio).
- Quien consume el secreto recibe **solo su ARN** y se le da permiso `GetSecretValue`
  scopeado a ese ARN (ver punto 5).

```hcl
resource "random_password" "master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}
```

### 4a. Módulo `secrets` — provistos vs generados (map-driven)

Un módulo `secrets` reutilizable modela cada secreto con dos tipos de clave:
`generated_keys` (Terraform los genera con `random_password` — JWT, API keys
internas) y `values` (texto provisto — credenciales de terceros). Guarda cada
secreto como JSON con una clave por valor, y expone un output **listo para
consumir** por el compute (una entrada `{ name, valueFrom }` por clave JSON):

```hcl
module "secrets" {
  source       = "../../modules/secrets"
  project_name = var.project_name
  environment  = var.environment

  secrets = {
    jwt   = { description = "JWT signing secret.", generated_keys = ["JWT_SECRET"] }
    email = { description = "SMTP creds.", values = { EMAIL_USER = var.email_user, EMAIL_PASS = var.email_pass } }
  }
  tags = var.tags
}
# module.secrets.ecs_secrets  ->  [{ name = "JWT_SECRET", valueFrom = "<arn>:JWT_SECRET::" }, ...]
```

Los valores generados usan `special = false` (alfanuméricos) para no romper a
ningún consumidor que parsee la cadena.

### 4b. Entradas sensibles: `secrets.auto.tfvars` (gitignoreado)

Los **valores sensibles de entrada** (los que alimentan `values` del módulo
`secrets`) nunca van en el `terraform.tfvars` versionado. Se pasan por un archivo
`*.auto.tfvars` (que Terraform carga solo) y que está en `.gitignore`, o por
variables `TF_VAR_*`. Se versiona una **plantilla** `.example` con placeholders:

```
environments/<env>/
├── terraform.tfvars              # valores NO sensibles (versionado)
├── secrets.auto.tfvars           # valores sensibles reales (GITIGNOREADO)
└── secrets.auto.tfvars.example   # plantilla con placeholders (versionado)
```

```gitignore
# .gitignore del repo
*.auto.tfvars
*.auto.tfvars.json
```

La variable que recibe el valor sensible se marca `sensitive = true` en
`variables.tf`. Regla: si un valor es un secreto, entra por `*.auto.tfvars`/`TF_VAR_`
→ se almacena en Secrets Manager → el compute lo lee de ahí. **Nunca** transita por
un archivo versionado ni por env vars en claro del contenedor.

## 5. IAM de mínimo privilegio

- Un rol por identidad de ejecución; políticas scopeadas al **recurso concreto**
  (ARN del secreto, del bucket, del topic), no `Resource = "*"` salvo cuando el
  servicio lo exige (p.ej. `kms:Decrypt`), y entonces **con condición**:

```hcl
statement {
  actions   = ["kms:Decrypt"]
  resources = ["*"]
  condition {
    test     = "StringEquals"
    variable = "kms:ViaService"
    values   = ["secretsmanager.${data.aws_region.current.name}.amazonaws.com"]
  }
}
```

- Separa el rol de *ejecución/plataforma* (pull de imágenes, logs, leer secretos)
  del rol de *aplicación en runtime* (acceso a S3, SNS, etc.). El de runtime
  arranca **sin políticas**; se le adjuntan permisos explícitos por caso de uso.
- Las políticas se construyen con `data "aws_iam_policy_document"`, no JSON a mano.

## 6. Acceso operativo vía bastion, no exponiendo la DB

El acceso administrativo a la base se hace por túnel SSH a un **bastion** en la
capa pública; la DB nunca recibe una IP pública. El bastion añade su propia regla
de ingress al SG de la DB (regla 07). En prod, restringe el SSH del bastion al
CIDR corporativo/VPN.

## 7. Protección de datos en prod

```hcl
deletion_protection     = true    # prod
skip_final_snapshot     = false   # prod: conserva snapshot al destruir
backup_retention_period = 30      # prod (dev: 1)
```

Considera `lifecycle { prevent_destroy = true }` en recursos con estado (RDS,
buckets con datos) cuando aplique (regla 05). En dev estos valores se relajan
para permitir iterar sin costo.

## 8. State seguro

El bucket de state va cifrado, versionado y con `public_access_block` completo,
con locking (`use_lockfile`) para evitar applies concurrentes (regla 02).

## 9. Trazabilidad

- `default_tags` + `common_tags` garantizan `Project`/`Environment`/`ManagedBy`
  en cada recurso (regla 04): base para cost allocation y auditoría.
- Habilita logging donde exista (WAF logging, ALB access logs, CloudFront logs,
  `debug_logging` del proxy solo para diagnóstico puntual).

## Checklist rápido antes de dar por terminado un módulo

- [ ] ¿El componente está en la capa correcta (data/private/public)?
- [ ] ¿Cifrado en reposo activado? ¿TLS en tránsito si aplica?
- [ ] ¿Ningún recurso con datos es `publicly_accessible`?
- [ ] ¿Buckets con `public_access_block` completo?
- [ ] ¿Secretos en Secrets Manager, no en variables ni código?
- [ ] ¿IAM scopeado a ARNs concretos (o con condición si es `*`)?
- [ ] ¿Ingress interno por SG-ref, no por CIDR?
- [ ] ¿`deletion_protection`/backups configurados según entorno?
