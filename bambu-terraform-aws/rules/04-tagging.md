# 04 — Tagging

El proyecto usa dos capas de tags que se complementan. Nunca se duplica lógica entre ellas.

## Capa 1 — `default_tags` en el provider (entorno)

Definido en `environments/<env>/versions.tf`. Se aplica automáticamente a **todos** los recursos del entorno sin escribirlos en cada recurso:

```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
```

## Capa 2 — `common_tags` en el módulo

Definido en `locals` de cada módulo. Repite los tres tags base para que el módulo sea usable independientemente del entorno que lo consuma, y mergea `var.tags` para permitir tags adicionales por entorno:

```hcl
locals {
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

Se aplica en cada recurso del módulo:

```hcl
tags = merge(local.common_tags, {
  Name = "${local.name_prefix}-<tipo>"
})
```

## Tag `Tier`

Recursos con capa lógica agregan el tag `Tier`:

```hcl
# Subnets
tags = merge(local.common_tags, {
  Name = "${local.name_prefix}-public-${each.value.az}"
  Tier = "public"
})

# Route tables
tags = merge(local.common_tags, {
  Name = "${local.name_prefix}-private-rt"
  Tier = "private"
})
```

Valores válidos de `Tier`: `"public"`, `"private"`, `"data"`.

## Tags adicionales por entorno (`var.tags`)

Definidos en `terraform.tfvars` de cada entorno. Los valores concretos dependen del proyecto:

```hcl
# environments/dev/terraform.tfvars
tags = {
  Owner      = "platform-team"
  CostCenter = "{project}-dev"
}
```

## Resultado final en un recurso (subnet pública)

```
Project     = "{project_name}"                  ← default_tags + common_tags
Environment = "dev"                             ← default_tags + common_tags
ManagedBy   = "Terraform"                       ← default_tags + common_tags
Name        = "{project_name}-dev-public-{az}"  ← recurso
Tier        = "public"                          ← recurso
Owner       = "platform-team"                   ← var.tags
CostCenter  = "{project}-dev"                   ← var.tags
```

## Variable `tags` — obligatoria en todo módulo

```hcl
variable "tags" {
  description = "Additional tags merged onto every resource created by this module."
  type        = map(string)
  default     = {}
}
```

## Anti-patrones

```hcl
# ❌ Tags hardcodeados (no parametrizados)
tags = {
  Project     = "my-project"
  Environment = "dev"
}

# ❌ No mergear var.tags — impide override por entorno
tags = local.common_tags

# ❌ Módulo sin variable tags
# (no hay forma de agregar tags desde el entorno)
```
