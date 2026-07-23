# Mode A — start a new project

Scaffold the methodology files from a minimal interview and the applicable stack annex,
leaving G0 (foundation) as the active goal — do not implement features in the same pass.

## Steps

1. **Minimal interview** (not an interrogation; only what the context doesn't already
   answer): product domain and objective, stack, existing backend/API or to be defined,
   branches (default: `develop` for work / `main` for releases), and the first 2–4
   candidate goals.
2. **Stack annex**: read the one that applies — `rules/09-stack-flutter.md`,
   `rules/10-stack-android.md`, `rules/11-stack-web.md`. If the stack has no annex, derive
   equivalent conventions (same categories: structure, state, networking, models, style,
   copy) and document them in `AGENTS.md`.
3. **Generate** from `templates/` (read `templates/file-recipes.md` first): `AGENTS.md`,
   `CLAUDE.md`, `GOALS.md` (G0 = foundation/scaffold as active goal), `MEMORY.md`,
   `.github/PULL_REQUEST_TEMPLATE.md`, `docs/plans/` (empty, one-line README), and the
   `AGENTS.md` security section taken from `rules/08-security-audit.md → Per-project
   security conventions`.
4. **If there is an API/backend**: create the project's API reference skill under
   `.claude/skills/<project>-api/` (condensed OpenAPI map + the rule "never guess the
   endpoint — when in doubt, list candidates and ask"). Recipe in
   `templates/file-recipes.md → Per-project API skill`.
5. Leave G0 ready to be worked in mode C. Do not implement features in the same pass as
   the scaffold unless the user asks for it.
