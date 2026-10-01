# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is a collection of **Claude Code Agent Skills** authored at Bambu. There is no application to build, lint, or run — every artifact is Markdown that Claude Code itself consumes at runtime. "Editing code" here means editing skill definitions and their supporting reference material.

## Skill anatomy

Each top-level directory is one self-contained skill:

```
<skill-name>/
  SKILL.md          # required entry point
  rules/*.md        # optional: numbered, progressively-disclosed rule files
  templates/*.md    # optional: skeletons + per-section recipes
```

- `SKILL.md` starts with YAML frontmatter containing exactly `name` (must match the directory name, kebab-case) and `description`. The `description` is the only thing Claude sees when deciding whether to load the skill, so it must enumerate concrete trigger phrases and the situations that should activate it — write it as a routing signal, not a summary.
- The body is instructions addressed to a future Claude instance, not end-user docs. It says when to load, how to apply step-by-step, and what the hard constraints are.
- Supporting files are referenced by relative path from `SKILL.md` (e.g. `rules/01-dto-testing.md`, `templates/README.template.md`) and loaded on demand — keep `SKILL.md` as the index and push detail into them.

## Conventions that span the skills

- **Rule files are numbered** (`01-`, `02-`, …) and `SKILL.md` carries a rule-index table mapping number → one-line summary → filename. Keep the table in sync when adding or reordering rules.
- **Canonical-pattern style**: each rule states the rule in one sentence, then shows a single copy-pasteable code block under a `## Canonical pattern` / `## Canonical setup` heading. Patterns are presented as overrides that win over generic framework advice when they conflict.
- **Templates use `{{PLACEHOLDER}}` tokens** filled at generation time; `templates/section-recipes.md` documents how to render each one and which are conditionally omitted. A skill that emits files must never leave an unsubstituted `{{...}}`.
- Skills are designed to be **bilingual-aware** (Spanish/English trigger phrases) and to match the language of existing project artifacts rather than forcing one.

## Existing skills

- `bambu-nest-rules/` — project-specific conventions for the NestJS + Prisma monorepo (dynamic-module libs, Secrets Manager, typed envs, i18n, DI, thin controllers). Specific to that *consumer* monorepo, not to this repo.
- `bambu-nest-test/` — unit-testing patterns for a NestJS + Prisma + nestjs-i18n monorepo (DTO / service / controller / module tests). The patterns it documents are specific to that *consumer* monorepo, not to this repo.
- `bambu-nest-api-guide/` — read-only-on-git skill for that same NestJS + Prisma monorepo: diffs a git range, classifies every touched endpoint (new/modified/removed) and breaking vs. additive changes, then publishes a frontend-facing API integration guide as an Artifact. Specific to that *consumer* monorepo, not to this repo.
- `bambu-git-flow/` — enforces Bambu's internal Branching Strategy Policy (v0.1, draft) in any org repo: infers branch type, validates the `<type>/<module>-<description>[-<ticket>]` naming convention, and opens draft PRs with the right base/merge-method/version-label after running the policy's pre-checks (open-PR count, diff size, oversized files). Never merges, approves, force-pushes, or bypasses protections — those stay human decisions. Project-agnostic in the sense that it applies to any Bambu repo, but encodes a Bambu-specific policy, not a generic git workflow.
- `bambu-readme-generator/` — language-agnostic root `README.md` generator that autodiscovers stack, layout, and scripts from the filesystem.
- `bambu-security-setup/` — bootstraps (or audits) Snyk dependency-scanning CI for any repo: detects package manager/runtime/monorepo layout, generates the blocking GitHub Actions workflow + weekly schedule, `.snyk` CODEOWNERS, `SNYK_TOKEN` secret, and security-team access. Project-agnostic, like `bambu-terraform-aws`.
- `bambu-terraform-aws/` — reusable, project-agnostic conventions for generating, modifying, and reviewing Terraform infrastructure on AWS (modules, environments, VPC/networking, security groups, tagging, interchangeable compute layer).
- `bambu-worktree/` — project-agnostic: creates an isolated `git worktree` under `worktrees/<feature>/` with its own branch, from a short requirement description or an explicit branch name, so several requirements can progress in parallel without repeated stash/checkout in the same working directory.
- `bambu-e2e-test-matrix/` — generic manual E2E QA orchestrator: explores a web app, builds an approvable test matrix, then runs it in batches via Playwright MCP (one module per sub-agent), records continuous video evidence, checkpoints/resumes runs, optionally diffs against Figma and runs SAST, and closes with a score + ranking. Unlike the other skills it has `scripts/`, `references/` (incl. `agents/` sub-agent profiles), and `assets/templates/`, and requires the Playwright MCP configured via its `scripts/setup.sh`.
- `bambu-snyk-dependency-hardening/` — portable, project-agnostic decision framework for triaging and remediating Snyk (or equivalent SCA) findings in third-party dependencies: upgrade-vs-exception decision tree, safe-upgrade verification, `.snyk` ignore-entry format, and severity-based expiration policy. Has its own `README.md` explaining how it triggers (automatic vs. explicit).
- `bambu-spec-define/` + `bambu-spec-implement/` — project-agnostic spec-driven-design pair. `bambu-spec-define` is the deliberately slow half: Socratic, section-by-section authoring of a `SPEC NN` file from `templates/SPEC.template.md` (see `templates/section-recipes.md`), plus the Draft → In review → Approved → Implemented → Obsolete lifecycle gate. `bambu-spec-implement` is the fast half: refuses to start unless the spec (and everything in its `Depends on:`) is Approved, executes the spec's contract as written, and flips it to Implemented on completion. Never merge their responsibilities — the define skill never writes application code, the implement skill never edits a spec's substantive sections.

## When editing or adding skills

- Keep `name` frontmatter === directory name, or the skill won't resolve.
- Treat the `description` as the highest-leverage field — if a skill isn't triggering, the fix is almost always there.
- Don't add build config, package manifests, or CI here; this repo intentionally has none. The `.gitignore` covers generic editor/OS noise only.
</content>
</invoke>
