# bambu-terraform-aws

Generate, modify, or review Terraform infrastructure for AWS projects following
a set of **reusable, project-agnostic conventions**. It serves both this
repository and any other AWS/Terraform project that adopts the same way of
working. The argument received (`$ARGUMENTS`) is the name of the module or
component to create/modify (e.g. `rds`, `alb`, `lambda-api`, `eks`).

## Guiding principle

These rules **do not depend on the project name or the application stack**. The
project is parameterized with `project_name`, `environment`, region, and CIDRs;
the application layer (Lambda, Fargate, EC2, EKS…) is **interchangeable** on top
of a common base of networking, data, and security. A project can be serverless
today and Fargate tomorrow: the base (3-layer VPC, private RDS, tags, state,
security) does not change — only the compute module and its wiring in `main.tf`
change.

## When to use this skill

- When creating a new module in `modules/`
- When creating or extending an environment in `environments/`
- When choosing/switching a project's application layer (serverless ↔ containers)
- When reviewing Terraform code to verify conventions, private networking, and security
- When the `aws-terraform-architect` agent generates code

## Rules — read them BEFORE generating any file

**Cross-cutting base (applies to every project):**

1. **[Module structure](rules/01-module-structure.md)** — required files, `locals`, what goes in each one
2. **[Environment structure](rules/02-environment-structure.md)** — root modules, active S3 backend, provider, standalone wiring resources
3. **[Naming](rules/03-naming.md)** — naming pattern, `name_prefix`, suffixes
4. **[Tagging](rules/04-tagging.md)** — two tag layers, `common_tags`, `Tier` tag
5. **[Iteration and outputs](rules/05-iteration-and-outputs.md)** — `for_each` vs `count`, deterministic outputs
6. **[Networking and subnet layers](rules/06-networking-and-subnets.md)** — 3-layer VPC, where each component lives
7. **[Security groups](rules/07-security-groups.md)** — one SG per component, SG-to-SG references, cross-module rules
8. **[Security and Well-Architected](rules/08-security-and-well-architected.md)** — non-negotiable baseline (private networking, encryption, secrets, least-privilege IAM)

**Application layer (the dynamic part):**

9. **[Application layer](rules/09-application-layer.md)** — how to choose and wire the compute (Lambda / Fargate / EC2 / EKS) on top of the common base

**Documentation:**

10. **[Environment documentation](rules/10-environment-documentation.md)** — structure of each environment's `README.md` (architecture, modules, operations)

## Current project context — always read it first

Before generating any file, inspect the repo's actual state (don't assume): the
rules are the way of working, the repo is the concrete truth.

- `environments/` → existing environments and their values (`terraform.tfvars`)
- `modules/` → modules already present and the outputs they expose
- Use existing module outputs to wire dependencies (`module.vpc.vpc_id`)
- Verify which modules the environment **actually** invokes: there may be modules
  in `modules/` that no active environment uses (inherited from another stack).
  Don't assume they're wired — check the environment's `main.tf`.

## Workflow when creating a module or component

1. If `$ARGUMENTS` doesn't carry clear requirements, **ask for them** before generating code (ports, whether it's public/private, whether it persists data, dependencies).
2. Read the current state of the project (existing environments and modules).
3. Decide the component's logical layer (public / private / data) per [rule 06](rules/06-networking-and-subnets.md) and its access model per [rule 07](rules/07-security-groups.md).
4. Generate the files in `modules/$ARGUMENTS/` applying **all** the rules.
5. Wire the module in the environment's `main.tf`; add standalone glue resources (SGs, cross-module ingress rules) only when appropriate ([rule 02](rules/02-environment-structure.md)).
6. Update the environment's `variables.tf`, `outputs.tf`, and `terraform.tfvars`.
7. Create or update the environment's `README.md` ([rule 10](rules/10-environment-documentation.md)) in the same change, with the real values.
8. `terraform fmt -recursive` and `terraform validate` from the environment directory.
9. Report non-obvious design decisions and any deviation from the rules with its justification.
