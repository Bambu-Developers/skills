# 10 — Documentación de entornos (README.md)

Cada entorno en `environments/<env>/` lleva un `README.md` que documenta **qué se
despliega y cómo operarlo**. Es un entregable, no opcional: se crea al nacer el
entorno y se **actualiza en el mismo cambio** que agrega/quita módulos o recursos
(un README desactualizado es peor que no tenerlo).

> Alcance: esta regla aplica a los README de **entornos**. Los módulos **no**
> llevan README por defecto (regla 01) salvo que el usuario lo pida.

## Principio: valores reales, no placeholders

El README describe el estado **concreto** de ese entorno. Extrae los valores del
propio repo antes de escribir — nunca inventes:

- región, cuenta, `project_name`, `environment`, CIDRs, tamaños → `terraform.tfvars`
- módulos activos y recursos sueltos → `main.tf`
- nombres de outputs para los ejemplos de comandos → `outputs.tf`
- key del state y tipo de locking → `versions.tf`

Todo ejemplo de comando usa `terraform output <nombre_real>` para que copie-pegue
funcione. No hardcodees endpoints/IPs que solo se conocen tras `apply`.

## Estructura (en este orden)

### 1. Título e introducción
`# Entorno <env>` + 2-3 líneas: qué es (root module de `<proyecto>`), qué
despliega, región y cuenta, y **el tipo de capa de aplicación** (serverless /
contenedores / etc. — la parte dinámica, regla 09).

### 2. Diferencias frente a otro entorno — *solo si deriva de uno*
Cuando el entorno se basa en otro (p.ej. `prod` deriva de `dev`), una tabla
`| Área | <base> | <este> |` con las diferencias (CIDR, NAT, tamaños de instancia,
backups, `deletion_protection`, naming de repos). Añade notas `>` para decisiones
deliberadas (p.ej. por qué Multi-AZ sigue en `false`).

### 3. Arquitectura (diagrama ASCII)
Diagrama que muestre las **tres capas** (regla 06) y el flujo de tráfico. Convención:

```
                              Internet / SSH:22
                                  │
┌── AWS Cloud · <region> · Cuenta <acct> · VPC <cidr> ─────────────────────┐
├── PUBLIC SUBNETS ─────────────────────────────────────────────────────────┤
│   Borde/acceso: ALB o bastion (según capa de app)                         │
├── PRIVATE SUBNETS ────────────────────────────────────────────────────────┤
│   Capa de aplicación (Lambda / Fargate / EC2) · SG app  ──:puerto──┐      │
├── DATA SUBNETS ────────────────────────────────────────────────────┼──────┤
│   RDS Proxy → RDS · caché · (nunca público)                        ◄┘      │
├── AWS Services ───────────────────────────────────────────────────────────┤
│   Secrets Manager · SNS · S3 · CloudFront · ECR (los que apliquen)        │
└────────────────────────────────────────────────────────────────────────────┘

Backend de Terraform (state remoto):
  S3  <bucket>  (versionado + cifrado)  ·  key <env>/terraform.tfstate
  Locking nativo de S3 (use_lockfile) — sin DynamoDB
```

Ajusta el borde y la capa privada al runtime real: bastion+Lambdas para
serverless; ALB→ECS para Fargate. Anota puertos y CIDRs reales de cada capa/AZ.

### 4. Módulos activos
Tabla `| Módulo | Descripción |` con **solo los módulos que este entorno invoca**
(no los que existen en `modules/` pero no se usan aquí). Descripción con los
valores concretos del entorno.

### 5. Recursos sueltos (en `main.tf`)
Tabla `| Recurso | Descripción |` con el glue/cableado del entorno (SG de la app,
buckets, CloudFront, policies). Ver regla 02.

### 6. Plan de direcciones — *opcional, útil en VPCs grandes*
Tabla `| Capa | AZ-a | AZ-b |` con los CIDR por capa/AZ y el rango reservado para
crecimiento.

### 7. Estado remoto (backend S3)
El flujo básico (`cd environments/<env>` → `init` → `plan` → `apply`), la key del
state, y la nota de que provider/backend **no fijan `profile`** (cadena de
credenciales por defecto → apuntar a la cuenta correcta).

### 8. Secciones por componente (las que apliquen)
Una subsección por componente presente, cada una con **cómo operarlo** y comandos
`terraform output`. Incluye solo las que existan en el entorno:

- **Acceso operativo (bastion / SSH key pair):** crear el key pair, conectarse,
  validar la BD. En prod, recordar restringir `ssh_cidr` al CIDR corporativo/VPN.
- **RDS Proxy / base de datos:** cómo autentica (Secrets Manager), quién puede
  llegar (tabla origen→ruta→regla de SG), TLS.
- **Conectar la app a la BD:** SG a asignar, subnets privadas, endpoint del
  **proxy** (no la instancia), de dónde salen las credenciales.
- **SNS / colas:** topics y cómo cablear suscripciones.
- **S3 / CloudFront:** nomenclatura de buckets, bloqueo público, y el patrón de
  aislamiento público/privado por prefijo (OAC) si aplica.
- **ECR:** naming del repo (compartido vs por-entorno), login/build/push.

## Cuándo actualizarlo

Regenera o edita el README del entorno en el mismo cambio que:
- agrega/quita un módulo o recurso suelto,
- cambia un valor visible en la doc (tamaño, CIDR, naming, retención),
- cambia el runtime de la capa de aplicación (serverless ↔ contenedores).

## Anti-patrones

- ❌ Placeholders o valores inventados en vez de leer `tfvars`/`outputs`.
- ❌ Documentar módulos que existen en `modules/` pero que el entorno no invoca.
- ❌ Hardcodear endpoints/IPs post-apply en vez de `terraform output`.
- ❌ Copiar el README de otro entorno sin ajustar valores (CIDR, cuenta, tamaños).
- ❌ Dejar el README desalineado con el `main.tf` tras un cambio.
