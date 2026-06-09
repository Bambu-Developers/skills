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

- `bambu-nest-test/` — unit-testing patterns for a NestJS + Prisma + nestjs-i18n monorepo (DTO / service / controller / module tests). The patterns it documents are specific to that *consumer* monorepo, not to this repo.
- `bambu-readme-generator/` — language-agnostic root `README.md` generator that autodiscovers stack, layout, and scripts from the filesystem.

## When editing or adding skills

- Keep `name` frontmatter === directory name, or the skill won't resolve.
- Treat the `description` as the highest-leverage field — if a skill isn't triggering, the fix is almost always there.
- Don't add build config, package manifests, or CI here; this repo intentionally has none. The `.gitignore` covers generic editor/OS noise only.
</content>
</invoke>
