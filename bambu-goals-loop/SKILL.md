---
name: bambu-goals-loop
description: Bambú Tech Services development methodology — goals with deliverable checklists, session loops, and persistent memory (GOALS.md / MEMORY.md / AGENTS.md), with code security (OWASP) built into every checkpoint. Load whenever the user wants to start a new software project (mobile, web, backend, or QA/analysis), adapt an existing repo to the methodology, open or close a work session, resume a project ("where were we?", "continue with the active goal"), close a goal with a PR, or audit a project (quality, architecture, or security). Triggers on mentions of GOALS.md, MEMORY.md, AGENTS.md, "goals methodology", "active goal", "review checkpoint", "leave the build green", "security review", "QA audit", "metodología de goals", "meta activa", "¿en qué nos quedamos?", "abrir/cerrar sesión", "cierra la meta", "abre el PR", "auditoría de seguridad". If the user asks to build any feature inside a repo that already contains GOALS.md or MEMORY.md, this skill applies — run the session loop before touching code.
---

# bambu-goals-loop

Development methodology proven in production (TrenMaya_App, TrenMaya_AppTpv): the project
advances by **goals** with deliverable checklists, every work session is a **loop**
(open → work in small reviewable steps with checkpoints → close), and state lives in
**persistent memory** versioned in the repo. Security is not a phase: it is a gate at
every checkpoint.

## The 3-file system

| File | What it holds | When it changes |
|---|---|---|
| `GOALS.md` | Goals G0–Gn with deliverable checklists, the active goal, blocked goals ⛔ with the unblock owner | On session close (check boxes) and when defining/closing goals |
| `MEMORY.md` | Current state by date, decisions (date + who decided), external blockers, open questions, environment gotchas, "what's next" | On session close |
| `AGENTS.md` | **Single source of truth for conventions**: stack, folder structure, architecture rules, workflow, working style | Only when a convention changes |

`CLAUDE.md` exists but **only delegates**: it contains just the pointer "read `AGENTS.md`"
(optionally plus the session-loop summary). Never duplicate conventions there — two sources
of truth always diverge. Full detail in `rules/01-memory-system.md`.

## Detect the mode before acting

| The user says… | Mode | Rule |
|---|---|---|
| "start/bootstrap a new project", "scaffold for X" | **A — Start project** | `rules/02-start-new-project.md` |
| "adapt this project to the methodology", existing repo without GOALS.md | **B — Retrofit** | `rules/03-retrofit.md` |
| "continue", "where were we?", any feature in a repo with GOALS.md | **C — Work session** | `rules/04-session-loop.md` |
| "close the goal", "open the PR", "we finished GX" | **D — Goal closure** | `rules/05-goal-closure.md` |
| "audit", "review quality/security", "QA analysis of this project" | **E — QA / Audit** | `rules/06-qa-audit.md` |

If the mode is ambiguous, ask — don't assume.

## Rule index

| # | Rule | File |
|---|------|------|
| 1 | Persistent memory: the 3-file system, CLAUDE.md delegation, language policy | `rules/01-memory-system.md` |
| 2 | Mode A — start a new project (interview, stack annex, generate files, API skill) | `rules/02-start-new-project.md` |
| 3 | Mode B — retrofit an existing repo (document reality, rebuild history, audit) | `rules/03-retrofit.md` |
| 4 | Mode C — the session loop: open → small steps with review checkpoints → close | `rules/04-session-loop.md` |
| 5 | Mode D — goal closure: checklist, pre-PR audit, PR to `develop`, immutable IDs | `rules/05-goal-closure.md` |
| 6 | Mode E — QA / audit with prioritized, evidence-backed findings | `rules/06-qa-audit.md` |
| 7 | Security gates: 1-minute checkpoint gate + pre-PR checklist on the branch diff | `rules/07-security-gates.md` |
| 8 | Full security audit (grounded OWASP Top 10) + per-project-type specifics | `rules/08-security-audit.md` |
| 9 | Stack annex — Flutter (forui, Riverpod, auto_route, dio, freezed, fvm) | `rules/09-stack-flutter.md` |
| 10 | Stack annex — native Android (Kotlin, MVVM, Retrofit, Hilt, hardware behind interfaces) | `rules/10-stack-android.md` |
| 11 | Stack annex — Web (TypeScript strict, TanStack Query, zod, env-validated config) | `rules/11-stack-web.md` |

## Templates

The canonical skeletons for every generated file live in `templates/` and use
`{{PLACEHOLDER}}` tokens. `templates/file-recipes.md` documents how to render each one —
read it before generating any file, and never leave an unsubstituted `{{...}}`.

| File to generate | Template |
|---|---|
| `GOALS.md` | `templates/GOALS.template.md` |
| `MEMORY.md` | `templates/MEMORY.template.md` |
| `AGENTS.md` | `templates/AGENTS.template.md` |
| `CLAUDE.md` | `templates/CLAUDE.template.md` |
| `.github/PULL_REQUEST_TEMPLATE.md` | `templates/PULL_REQUEST_TEMPLATE.md` |
| Per-project API skill, `docs/plans/` | recipes in `templates/file-recipes.md` |

## Golden rules (all modes)

- Every recorded decision carries a **date and who made it** (PM, developer, client, backend).
- Every blocked goal is marked **⛔ with the unblock owner** ("blocked by backend: real
  gateway missing") — a blocker without an owner never gets unblocked.
- UI copy localized from day 0, never hardcoded. Money never in binary floats.
- Architecture suggestions: one line per opportunity at the end of the response —
  **never implement them without explicit approval**.
- GOALS/MEMORY follow the user's language (Spanish by default at Bambú); code, identifiers,
  and comments in English.
