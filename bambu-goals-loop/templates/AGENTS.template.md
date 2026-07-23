# {{PROJECT}} — Agent Conventions

> **This file is the single source of truth for conventions.**
> `CLAUDE.md` delegates here — update conventions only in this file.

## Planning & Workflow

**Every implementation plan is split into small, independently reviewable steps.**
Each step ends in a developer review checkpoint: when a step is done, stop and wait for
approval before the next one. Why: long unreviewed passes accumulate errors; small steps
catch them while fixing is still cheap.

**Sessions by goals.** Progress lives in `GOALS.md` (goals with checklists) and
`MEMORY.md` (state, decisions, blockers). On session open read both and work only the
active goal. Each goal opens a `feature/gX-{{NAME}}` branch from `develop` and closes with
a PR into `develop`. On session close: check boxes in GOALS, update MEMORY, and leave the
build green.

## Working style — challenge & clarify

Don't be compliant by reflex: for ambiguous or questionable requests, state the trade-off
and agree before building. But don't manufacture friction: if the path is clear, just do
the work. Assert only what is verifiable from this file and the code; when unsure, say so
and verify.

## Pull Requests

Every PR targets `develop` — never `main` unless explicitly instructed for that PR.

## Stack

{{TABLE_OF_LIBRARIES_FRAMEWORKS_WITH_VERSIONS_AND_CANONICAL_BUILD_TEST_LINT_COMMANDS}}

## Structure

{{FOLDER_TREE_PLUS_ARCHITECTURE_RULES_WHERE_COMPONENTS_MODELS_STATE_NETWORK_ENV_CONFIG_LIVE_PROMOTION_RULE_NAMING}}

## Security

{{PASTE_PER_PROJECT_SECURITY_CONVENTIONS_FROM_RULES_08_ADJUSTED_TO_THE_STACK}}

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| {{RULE}} | {{ANTIPATTERN}} |

## Roadmap, status & known gaps

Live status, known gaps, and open questions live in `GOALS.md` and `MEMORY.md` — not here.
Read them before working on features; update them in your PR.

## Proactive Architecture Suggestions

After any edit, scan the surrounding code for structural improvements — but never
implement them without explicit approval. One line per opportunity at the end of the
response.
