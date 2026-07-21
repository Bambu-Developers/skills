# 05 — Iteración y outputs

## `for_each` vs `count`

| Caso | Usar |
|------|------|
| Recurso que puede escalar (subnets, SGs por tier, nodos) | `for_each` con clave estable |
| Recurso booleano (existe / no existe) | `count = var.enable_x ? 1 : 0` |
| Recurso único sin variación | Bloque simple sin meta-argumento |

### Por qué `for_each` sobre `count` para recursos escalables

Con `count`, Terraform identifica recursos por índice entero. Agregar o quitar un elemento del medio desplaza todos los índices siguientes, forzando recreación en cascada. Con `for_each` y claves estables, cada recurso tiene identidad propia.

### Patrón `for_each` con mapa indexado por AZ

```hcl
locals {
  public_subnets = {
    for idx, cidr in var.public_subnet_cidrs :
    idx => { cidr = cidr, az = var.azs[idx] }
  }
}

resource "aws_subnet" "public" {
  for_each = local.public_subnets

  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  # ...
}
```

Las claves son índices enteros (`0`, `1`) pero convertidos a string implícitamente por Terraform. Para recursos donde se necesita como string explícito (NAT GW, EIP):

```hcl
resource "aws_nat_gateway" "this" {
  for_each = toset([for k in local.nat_gateway_keys : tostring(k)])
  # ...
}
```

## Outputs de listas — siempre ordenados

Los recursos creados con `for_each` producen un mapa, no una lista. Al exportarlos como lista, se ordena por clave para garantizar que el output sea determinista entre ejecuciones y refactorizaciones:

```hcl
# ✅ Correcto — ordenado
output "public_subnet_ids" {
  description = "Public subnet IDs ordered by AZ index."
  value       = [for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id]
}

# ❌ Incorrecto — orden indeterminado
output "public_subnet_ids" {
  value = [for k, v in aws_subnet.public : v.id]
}

# ❌ También incorrecto — values() no garantiza orden
output "public_subnet_ids" {
  value = values(aws_subnet.public)[*].id
}
```

## Outputs opcionales (recurso condicional con `count`)

Cuando un recurso usa `count`, el output puede ser `null` si no se creó:

```hcl
output "nat_gateway_id" {
  description = "ID of the primary NAT Gateway, or null when NAT is disabled."
  value       = local.nat_enabled ? aws_nat_gateway.this["0"].id : null
}
```

## Módulos opcionales (toggle a nivel entorno)

Un módulo completo puede activarse/desactivarse desde el entorno con
`count = var.flag ? 1 : 0` sobre el bloque `module`. Útil para piezas opcionales
del stack (WAF, ACM/HTTPS, un CDN). Al referenciar sus outputs se indexa `[0]`, y
el cableado en otros módulos se hace condicional:

```hcl
# El certificado ACM solo existe si se configuró un dominio.
module "acm" {
  count       = var.domain_name != "" ? 1 : 0
  source      = "../../modules/acm"
  domain_name = var.domain_name
  # ...
}

module "waf" {
  count        = var.waf_enabled ? 1 : 0
  source       = "../../modules/waf"
  resource_arn = module.alb.alb_arn
  # ...
}

module "alb" {
  source          = "../../modules/alb"
  certificate_arn = var.domain_name != "" ? module.acm[0].certificate_arn : ""
  # ...
}
```

Así una misma definición de entorno sirve para variantes (con/sin HTTPS, con/sin
WAF) sin duplicar código; la variante se elige en `terraform.tfvars`.

## `depends_on` explícito

Solo cuando Terraform no puede inferir la dependencia por referencias (raro). Ejemplo típico: EIP y NAT GW dependen de que el IGW esté attached antes de crearse.

```hcl
resource "aws_nat_gateway" "this" {
  # ...
  depends_on = [aws_internet_gateway.this]
}
```

No usar `depends_on` en módulos que consumen otros módulos — siempre referencia el output directamente (`module.vpc.vpc_id`) para que Terraform infiera la dependencia.

## `lifecycle` blocks

Usar cuando el recurso tiene estado externo que Terraform no debe destruir al cambiar:

```hcl
lifecycle {
  prevent_destroy = true  # RDS, buckets S3 con datos
}

lifecycle {
  ignore_changes = [engine_version]  # RDS minor version auto-upgrade
}
```

No agregar `lifecycle` por defecto — solo cuando hay una razón concreta.
