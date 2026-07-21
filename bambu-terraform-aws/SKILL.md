# bambu-terraform-aws

Genera, modifica o revisa infraestructura Terraform para proyectos AWS siguiendo
un conjunto de convenciones **reutilizables y agnósticas al proyecto**. Sirve
para este repositorio y para cualquier otro proyecto AWS/Terraform que adopte la
misma forma de trabajo. El argumento recibido (`$ARGUMENTS`) es el nombre del
módulo o componente a crear/modificar (ej. `rds`, `alb`, `lambda-api`, `eks`).

## Principio rector

Estas reglas **no dependen del nombre del proyecto ni del stack de aplicación**.
El proyecto se parametriza con `project_name`, `environment`, región y CIDRs; la
capa de aplicación (Lambda, Fargate, EC2, EKS…) es **intercambiable** sobre una
base común de red, datos y seguridad. Un proyecto puede ser serverless hoy y
Fargate mañana: la base (VPC de 3 capas, RDS privado, tags, state, seguridad) no
cambia — solo cambia el módulo de cómputo y su cableado en `main.tf`.

## Cuándo usar esta skill

- Al crear un nuevo módulo en `modules/`
- Al crear o extender un entorno en `environments/`
- Al elegir/cambiar la capa de aplicación de un proyecto (serverless ↔ contenedores)
- Al revisar código Terraform para verificar convenciones, red privada y seguridad
- Cuando el agente `aws-terraform-architect` genera código

## Reglas — léelas ANTES de generar cualquier archivo

**Base transversal (aplica a todo proyecto):**

1. **[Estructura de módulos](rules/01-estructura-modulos.md)** — archivos obligatorios, `locals`, qué va en cada uno
2. **[Estructura de entornos](rules/02-estructura-entornos.md)** — root modules, backend S3 activo, provider, recursos sueltos de cableado
3. **[Naming](rules/03-naming.md)** — patrón de nombres, `name_prefix`, sufijos
4. **[Tagging](rules/04-tagging.md)** — dos capas de tags, `common_tags`, tag `Tier`
5. **[Iteración y outputs](rules/05-iteracion-outputs.md)** — `for_each` vs `count`, outputs deterministas
6. **[Redes y capas de subnets](rules/06-redes-subnets.md)** — VPC de 3 capas, dónde vive cada componente
7. **[Security groups](rules/07-security-groups.md)** — un SG por componente, referencias SG-a-SG, reglas cross-módulo
8. **[Seguridad y Well-Architected](rules/08-seguridad-well-architected.md)** — baseline no negociable (red privada, cifrado, secretos, IAM mínimo)

**Capa de aplicación (parte dinámica):**

9. **[Capa de aplicación](rules/09-capa-aplicacion.md)** — cómo elegir y cablear el cómputo (Lambda / Fargate / EC2 / EKS) sobre la base común

**Documentación:**

10. **[Documentación de entornos](rules/10-documentacion-entornos.md)** — estructura del `README.md` de cada entorno (arquitectura, módulos, operación)

## Contexto del proyecto actual — léelo siempre primero

Antes de generar cualquier archivo, inspecciona el estado real del repo (no
asumas): las reglas son la forma de trabajo, el repo es la verdad concreta.

- `environments/` → entornos existentes y sus valores (`terraform.tfvars`)
- `modules/` → módulos ya presentes y los outputs que exponen
- Usa outputs de módulos existentes para cablear dependencias (`module.vpc.vpc_id`)
- Verifica qué módulos **realmente** invoca el entorno: puede haber módulos en
  `modules/` que ningún entorno activo usa (herencia de otro stack). No asumas
  que están cableados — revisa el `main.tf` del entorno.

## Flujo de trabajo al crear un módulo o componente

1. Si `$ARGUMENTS` no trae requisitos claros, **pregúntalos** antes de generar código (puertos, si es público/privado, si persiste datos, dependencias).
2. Lee el estado actual del proyecto (entornos y módulos existentes).
3. Decide la capa lógica del componente (public / private / data) según [regla 06](rules/06-redes-subnets.md) y su modelo de acceso según [regla 07](rules/07-security-groups.md).
4. Genera los archivos en `modules/$ARGUMENTS/` aplicando **todas** las reglas.
5. Cablea el módulo en el `main.tf` del entorno; añade recursos sueltos de glue (SGs, reglas de ingress cross-módulo) solo si corresponde ([regla 02](rules/02-estructura-entornos.md)).
6. Actualiza `variables.tf`, `outputs.tf` y `terraform.tfvars` del entorno.
7. Crea o actualiza el `README.md` del entorno ([regla 10](rules/10-documentacion-entornos.md)) en el mismo cambio, con los valores reales.
8. `terraform fmt -recursive` y `terraform validate` desde el directorio del entorno.
9. Reporta decisiones de diseño no obvias y cualquier desviación de las reglas con su justificación.
