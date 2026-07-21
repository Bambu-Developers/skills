# 02 — Estructura de entornos (root modules)

Cada entorno es un root module independiente en `environments/<env>/`. El esquema
típico es `dev`, `staging` y `prod`, aunque puede variar por proyecto. Cada
entorno tiene **su propio state** — nunca comparten un archivo de state.

## Archivos del root module

```
environments/<env>/
├── main.tf           # Llamadas a módulos + recursos sueltos de cableado
├── variables.tf      # Variables del entorno
├── outputs.tf        # Re-exporta outputs relevantes de los módulos
├── terraform.tfvars  # Valores concretos del entorno
├── versions.tf       # Backend S3 + configuración del provider
└── README.md         # Arquitectura y operación del entorno (regla 10)
```

## versions.tf del entorno — backend S3 con locking nativo

El state se guarda en S3 con **locking nativo de S3** (`use_lockfile = true`),
**sin tabla DynamoDB** (requiere Terraform ≥ 1.11). El versionado del bucket
guarda el historial de cada `apply`. El bucket sigue el patrón
`{project_name}-tfstate` y cada entorno usa un `key` distinto:

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # State per-entorno; locking nativo S3 (sin DynamoDB). Requiere TF >= 1.11.
  backend "s3" {
    bucket       = "{project_name}-tfstate"
    key          = "<env>/terraform.tfstate"
    region       = "<aws_region>"
    encrypt      = true
    use_lockfile = true
  }
}

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

> El provider y el backend **no fijan `profile`**: usan la cadena de credenciales
> por defecto de AWS. El operador es responsable de apuntar a la cuenta correcta.

### Bootstrap del bucket de state (una sola vez por proyecto)

```bash
aws s3api create-bucket --bucket {project_name}-tfstate --region <region> \
  --create-bucket-configuration LocationConstraint=<region>
aws s3api put-bucket-versioning --bucket {project_name}-tfstate \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket {project_name}-tfstate \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-public-access-block --bucket {project_name}-tfstate \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Para un entorno nuevo se **reutiliza el mismo bucket** cambiando solo el `key`
(ej. `staging/terraform.tfstate`).

## main.tf del entorno — módulos + cableado

El `main.tf` del entorno contiene dos cosas:

1. **Llamadas a módulos.** Siempre se pasan `project_name`, `environment` y `tags`.
2. **Recursos sueltos de "glue" (cableado entre módulos).** Este es el único
   lugar donde se permiten recursos fuera de un módulo, y **solo** para conectar
   módulos entre sí o resolver dependencias que no pertenecen a ningún módulo
   reutilizable. Ejemplos legítimos:
   - el SG de la capa de aplicación (Lambda/Fargate) que otros módulos referencian,
   - una regla de ingress que conecta dos módulos,
   - un bucket S3 o CloudFront específico de ese proyecto,
   - `data "aws_caller_identity"` / `data "aws_region"` para nombres únicos.

```hcl
module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
  azs          = var.azs

  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  data_subnet_cidrs    = var.data_subnet_cidrs

  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway

  tags = var.tags
}

# Glue: SG de la capa de aplicación (parte dinámica del proyecto). Ver regla 09.
resource "aws_security_group" "app" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Application compute layer: egress to data/proxy and AWS APIs."
  vpc_id      = module.vpc.vpc_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-app-sg"
  })
}
```

> **Regla:** lógica reutilizable → módulo. Cableado específico del entorno →
> recurso suelto en `main.tf`. Nunca metas lógica de negocio reutilizable como
> recurso suelto, ni cableado específico dentro de un módulo genérico.

## terraform.tfvars — valores concretos y diferencias por entorno

Cada entorno define sus valores. Los defaults de `dev` se optimizan en costo y se
"voltean" en `prod`:

```hcl
aws_region   = "<región>"
project_name = "<proyecto>"     # el MISMO en todos los entornos
environment  = "dev"            # cambia por entorno

vpc_cidr = "<cidr único por entorno>"   # rangos que no se solapen entre envs
azs      = ["<az-a>", "<az-b>"]

public_subnet_cidrs  = ["<cidr-a>", "<cidr-b>"]
private_subnet_cidrs = ["<cidr-a>", "<cidr-b>"]
data_subnet_cidrs    = ["<cidr-a>", "<cidr-b>"]

enable_nat_gateway = true
single_nat_gateway = true    # dev: 1 NAT compartido | prod: false (1 por AZ)

tags = {
  Owner      = "<equipo>"
  CostCenter = "<proyecto>-dev"
}
```

> `terraform.tfvars` se versiona y lleva **solo valores no sensibles**. Los
> secretos de entrada van en un `secrets.auto.tfvars` gitignoreado (o `TF_VAR_*`),
> con una plantilla `.example` versionada — ver [regla 08](08-seguridad-well-architected.md#4b-entradas-sensibles-secretsautotfvars-gitignoreado).

| Ajuste | dev (cost-optimized) | prod (resiliente) |
|--------|----------------------|-------------------|
| `single_nat_gateway` | `true` | `false` |
| Tamaño de instancias | mínimo | dimensionado |
| `deletion_protection` (datos) | `false` | `true` |
| `skip_final_snapshot` | `true` | `false` |
| Retención de backups | corta | larga |
| CIDR de VPC | rango A | rango B (sin solape) |

## Variables obligatorias en todo entorno

```hcl
variable "aws_region"   { description = "AWS region to deploy into."; type = string }
variable "project_name" { description = "Project identifier used as prefix for names and tags."; type = string }
variable "environment"  { description = "Deployment environment name."; type = string }
variable "tags"         { description = "Additional tags applied to resources."; type = map(string); default = {} }
```
