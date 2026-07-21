# 03 — Naming de recursos

## Patrón general

```
{project_name}-{environment}-{tipo_recurso}[-{sufijo}]
```

El prefijo base siempre se construye como un local en `main.tf`:

```hcl
locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
```

Y se aplica en el tag `Name` de cada recurso:

```hcl
tags = merge(local.common_tags, {
  Name = "${local.name_prefix}-<tipo>"
})
```

## Sufijos según el tipo de recurso

| Recurso | Sufijo | Ejemplo |
|---------|--------|---------|
| VPC | `-vpc` | `{project}-dev-vpc` |
| Internet Gateway | `-igw` | `{project}-dev-igw` |
| Subnet con AZ | `-{tier}-{az}` | `{project}-dev-public-us-east-1a` |
| NAT Gateway | `-nat-{idx}` | `{project}-dev-nat-0` |
| Elastic IP | `-nat-eip-{idx}` | `{project}-dev-nat-eip-0` |
| Route table | `-{tier}-rt` | `{project}-dev-private-rt` |
| Security Group | `-{nombre}-sg` | `{project}-dev-alb-sg` |
| ALB | `-{nombre}-alb` | `{project}-dev-public-alb` |
| EKS Cluster | `-{nombre}-eks` | `{project}-dev-eks` |
| RDS | `-{nombre}-rds` | `{project}-dev-rds` |

## Reglas

1. Todo en minúsculas, separado por guiones (`-`). Sin guiones bajos, sin mayúsculas.
2. El AZ se escribe completo (ej. `us-east-1a`), nunca abreviado (ej. `1a`).
3. Los índices de NAT GW se escriben como string (`"0"`, `"1"`) porque son claves de `for_each`.
4. El sufijo `-sg` va siempre al final para security groups, aunque tengan nombre descriptivo.

## Anti-patrones

```hcl
# ❌ Guiones bajos
Name = "${local.name_prefix}_vpc"

# ❌ AZ abreviada
Name = "${local.name_prefix}-public-1a"

# ❌ Sin name_prefix — hardcodeado
Name = "my-project-dev-vpc"

# ❌ Mayúsculas
Name = "${local.name_prefix}-ALB"
```
