# Persistent memory — the 3-file system

All project state lives in three files versioned in the repo — `GOALS.md`, `MEMORY.md`,
`AGENTS.md` — and `CLAUDE.md` only delegates to `AGENTS.md`.

## The files

| File | What it holds | When it changes |
|---|---|---|
| `GOALS.md` | Goals G0–Gn with deliverable checklists, the active goal, blocked goals ⛔ with the unblock owner | On session close (check delivered boxes) and when defining/closing goals |
| `MEMORY.md` | Current state by date, decisions (with date and who decided), external blockers, open questions, environment gotchas, "what's next" | On session close |
| `AGENTS.md` | **Single source of truth for conventions**: stack, folder structure, architecture rules, workflow, working style | Only when a convention changes |

## Canonical pattern — CLAUDE.md delegates

`CLAUDE.md` contains only the pointer to `AGENTS.md` (optionally plus the session-loop
summary). Never duplicate conventions there — two sources of truth always diverge.

```markdown
> **`AGENTS.md` is the single source of truth for conventions.**
> This file intentionally contains no conventions — do not add them here.
> Read `AGENTS.md` in full before writing code.
```

## Supporting rules

- Generate every file from its skeleton in `templates/` (see `templates/file-recipes.md`).
- **Compaction rule**: `MEMORY.md` keeps the current state + the previous 2–3; older
  entries are archived to `docs/memory-archive.md` (same format). A 400+ line MEMORY is no
  longer read on session open — and then it serves nothing.
- **Language policy**: GOALS/MEMORY follow the user's language (Spanish by default at
  Bambú); code, identifiers, and comments in English.
