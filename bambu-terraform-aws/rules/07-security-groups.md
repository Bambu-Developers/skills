# 07 — Security groups

Los security groups son el control de acceso **este-oeste** (entre componentes).
La regla central: el tráfico interno se autoriza **por referencia a otro SG**,
nunca por CIDR. Los CIDR solo se usan para tráfico que genuinamente viene de
internet o de un rango externo conocido (VPN corporativa).

## Un SG por componente

Cada componente tiene su propio SG dedicado, nombrado `{prefix}-{componente}-sg`
(regla 03) y etiquetado con su `Tier` cuando aplica. No se comparten SGs entre
componentes distintos.

## Reglas como recursos separados (no bloques inline)

Usa `aws_vpc_security_group_ingress_rule` / `aws_vpc_security_group_egress_rule`
(una regla = un recurso), **no** los bloques `ingress`/`egress` embebidos en
`aws_security_group`. Cada regla lleva `description` y su tag `Name`.

```hcl
resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app-sg"
  description = "Application compute: egress to data tier and AWS APIs."
  vpc_id      = var.vpc_id
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-app-sg" })
}
```

## Referencia SG-a-SG para tráfico interno

El origen permitido se expresa con `referenced_security_group_id`, no con
`cidr_ipv4`. Así el permiso sigue al componente aunque cambien sus IPs:

```hcl
# ✅ El almacén de datos solo acepta al SG de la app.
resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "DB port from the application SG only."
  from_port                    = var.db_port
  to_port                      = var.db_port
  ip_protocol                  = "tcp"
  referenced_security_group_id = var.app_sg_id
}
```

## Reglas cross-módulo: las agrega el consumidor, no el dueño del SG

Cuando un módulo B necesita alcanzar un recurso del módulo A, la **regla de
ingress sobre el SG de A la crea el módulo B** (recibiendo `a_sg_id` como
variable). Así el módulo A permanece sin modificar y sin conocer a sus clientes.

```hcl
# En el módulo bastion: el bastion añade su PROPIA regla al SG del RDS.
resource "aws_vpc_security_group_ingress_rule" "rds_from_bastion" {
  security_group_id            = var.rds_sg_id            # SG que pertenece al módulo rds
  referenced_security_group_id = aws_security_group.bastion.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "PostgreSQL from bastion host."
}
```

Patrón equivalente para listas de clientes (varias apps/SGs permitidos), keyeado
por índice de lista (conocido en plan-time), no por SG id (conocido tras apply):

```hcl
resource "aws_vpc_security_group_ingress_rule" "from_clients" {
  for_each = { for idx, sg_id in var.allowed_security_group_ids : idx => sg_id }

  security_group_id            = aws_security_group.proxy.id
  referenced_security_group_id = each.value
  from_port                    = var.db_port
  to_port                      = var.db_port
  ip_protocol                  = "tcp"
}
```

## Egress

- El egress `0.0.0.0/0` (todo saliente) es aceptable para cómputo y proxies que
  necesitan pulls de imágenes, logs y APIs de AWS — documenta el porqué en la
  `description`.
- Para SGs cuyo único rol es *iniciar* conexiones salientes (p.ej. el SG de
  Lambdas), define **solo egress**; el ingress a los destinos lo conceden esos
  destinos referenciando este SG.

## Ingress desde internet — solo en el borde público

`cidr_ipv4 = "0.0.0.0/0"` se permite únicamente en el SG del borde público
(ALB/NLB) en puertos 80/443, o en el bastion (SSH) — y en prod el SSH debería
restringirse al CIDR corporativo/VPN, no a `0.0.0.0/0`.

```hcl
# ✅ Borde público: HTTP/HTTPS desde internet al ALB.
resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
}
```

## Cadena típica de acceso (borde → app → datos)

```
Internet ──(80/443, CIDR 0.0.0.0/0)──▶ ALB SG
ALB SG ──(container_port, SG-ref)──────▶ App SG        (Fargate/EC2)
App SG ──(db_port, SG-ref)─────────────▶ Proxy/DB SG   (capa data)
Bastion SG ──(db_port, SG-ref)─────────▶ DB SG         (acceso operativo)
```

Cada flecha con SG-ref es una regla de ingress sobre el SG destino, creada por el
componente origen. La única flecha con CIDR es la primera (internet → borde).

## Anti-patrones

```hcl
# ❌ Autorizar tráfico interno por CIDR de la VPC en vez de por SG
cidr_ipv4 = "10.0.0.0/16"   # usa referenced_security_group_id

# ❌ Base de datos con ingress 0.0.0.0/0
security_group_id = aws_security_group.db.id
cidr_ipv4         = "0.0.0.0/0"

# ❌ Reglas inline dentro de aws_security_group (dificultan diffs y cross-módulo)
resource "aws_security_group" "x" { ingress { ... } }

# ❌ El módulo dueño del SG conociendo a todos sus clientes por nombre
#    (invierte la dependencia: el cliente añade su regla, no el dueño)
```
