# 06 — Redes y capas de subnets

Toda VPC se construye con **tres capas** de subnets, cada una replicada en al
menos **2 AZs**. La capa determina qué expone cada componente a internet. Esta
estructura es la base común de todo proyecto, independiente de la capa de
aplicación.

## Las tres capas

| Capa (`Tier`) | Ruta a internet | Qué vive aquí | `map_public_ip_on_launch` |
|---------------|-----------------|---------------|---------------------------|
| `public` | Directa vía **IGW** | ALB, NAT Gateway, bastion. Nada con datos. | `true` |
| `private` | Solo **salida** vía NAT GW | Cómputo de aplicación: Fargate, EC2 de app, Lambdas en VPC, EKS nodes. | `false` |
| `data` | Solo **salida** vía NAT GW | RDS, RDS Proxy, ElastiCache, Aurora. **Nunca accesible desde internet.** | `false` |

Regla de oro: **el dato nunca es público**. Cualquier almacén con estado
(base de datos, caché) va en la capa `data`, con `publicly_accessible = false` y
alcanzable únicamente por SG desde la capa de aplicación (ver regla 07).

## Ruteo por capa

- **public** → route table con ruta `0.0.0.0/0` al **Internet Gateway**.
- **private** y **data** → route table con ruta `0.0.0.0/0` al **NAT Gateway**
  (salida saliente para parches, pulls de ECR, llamadas a APIs de AWS), **sin
  ninguna ruta de entrada desde internet**.

```hcl
# Salida de private/data por NAT; jamás una ruta de entrada desde el IGW.
resource "aws_route" "private_nat" {
  count                  = local.nat_enabled ? 1 : 0
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this["0"].id
}
```

## NAT Gateway — costo vs. resiliencia

- `single_nat_gateway = true` → **1 NAT GW compartido** (default de `dev`,
  optimizado en costo). Todas las capas privadas salen por él.
- `single_nat_gateway = false` → **1 NAT GW por AZ** (recomendado en `prod`
  para no perder salida si cae una AZ).

> Si un entorno pasa a `single_nat_gateway = false`, el módulo VPC debe crear
> route tables **por AZ** para que cada subnet privada salga por el NAT de su
> propia zona. Con una sola route table por capa, todo apunta al primer NAT.

## Subnets con `for_each` indexado por AZ

Las subnets se crean con un mapa indexado por índice de AZ (nunca `count`), para
que agregar/quitar una AZ no recree las demás (ver regla 05):

```hcl
locals {
  public_subnets  = { for idx, cidr in var.public_subnet_cidrs : idx => { cidr = cidr, az = var.azs[idx] } }
  private_subnets = { for idx, cidr in var.private_subnet_cidrs : idx => { cidr = cidr, az = var.azs[idx] } }
  data_subnets    = { for idx, cidr in var.data_subnet_cidrs : idx => { cidr = cidr, az = var.azs[idx] } }
}
```

## Planeación de CIDRs

- Cada **entorno** usa un bloque CIDR que **no se solapa** con los demás
  (ej. dev `10.0.0.0/22`, prod `10.1.0.0/20`), para permitir peering futuro.
- Dentro de la VPC, reparte el espacio en las 3 capas × N AZs y **reserva** un
  rango sin asignar para crecimiento (más AZs, EKS, peering).
- La VPC habilita `enable_dns_support` y `enable_dns_hostnames`.

## DB Subnet Group / grupos de subnets de datos

Los almacenes de datos referencian **solo las subnets de la capa `data`**. AWS
exige subnets en ≥ 2 AZs incluso para instancias single-AZ:

```hcl
resource "aws_db_subnet_group" "this" {
  name       = "${local.name_prefix}-rds-subnet-group"
  subnet_ids = var.data_subnet_ids   # nunca subnets públicas
}
```

## Anti-patrones

```hcl
# ❌ Base de datos en subnet pública o accesible
publicly_accessible = true

# ❌ Ruta de entrada desde internet a private/data
resource "aws_route" "data_from_igw" { gateway_id = aws_internet_gateway.this.id }

# ❌ Cómputo de app en subnet pública "para que sea fácil de alcanzar"
#    (el acceso público entra por el ALB/CloudFront en la capa public, no por el compute)

# ❌ Mezclar componentes con datos en la capa private/public
```
