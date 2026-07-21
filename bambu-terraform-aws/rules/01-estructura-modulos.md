# 01 — Estructura de módulos

Cada módulo reutilizable vive en `modules/<nombre>/` y contiene exactamente cuatro archivos. No más, no menos.

## Archivos obligatorios

```
modules/<nombre>/
├── main.tf        # Recursos del módulo + locals
├── variables.tf   # Variables con description, type y validations
├── outputs.tf     # Valores exportados
└── versions.tf    # Constraints de Terraform y provider
```

No se crean READMEs ni archivos adicionales a menos que el usuario los pida explícitamente.

## main.tf

Siempre empieza con el bloque `locals`:

```hcl
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags,
  )
}
```

Los recursos van después de los locals. No se colocan recursos fuera del módulo en el archivo (data sources externos van en `data.tf` solo si hay más de tres).

## variables.tf

Toda variable lleva `description` y `type`. Las listas o maps que deban estar alineados con otra variable llevan un bloque `validation`:

```hcl
variable "project_name" {
  description = "Project identifier used as a prefix for resource names and tags."
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod) used in naming and tagging."
  type        = string
}

variable "tags" {
  description = "Additional tags merged onto every resource created by this module."
  type        = map(string)
  default     = {}
}
```

Las variables `project_name`, `environment` y `tags` son **obligatorias en todo módulo**.

## outputs.tf

Los outputs llevan `description`. Las listas derivadas de `for_each` se ordenan con `sort(keys(...))` para que sean deterministas entre ejecuciones:

```hcl
output "subnet_ids" {
  description = "Subnet IDs ordered by AZ index."
  value       = [for k in sort(keys(aws_subnet.this)) : aws_subnet.this[k].id]
}
```

## versions.tf

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

No se incluye bloque `provider` en el módulo — solo en el root module del entorno.

## Anti-patrones

```hcl
# ❌ Lógica reutilizable como recurso suelto en el root module (va en un módulo).
#    Excepción legítima: cableado/glue entre módulos en main.tf del entorno (regla 02).
resource "aws_security_group" "this" { ... }

# ❌ Output sin ordenar en for_each
value = [for k, v in aws_subnet.this : v.id]

# ❌ Variable sin description
variable "vpc_id" {
  type = string
}
```
