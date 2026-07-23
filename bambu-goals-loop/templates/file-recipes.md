# File recipes — how to render each template

General rules for every template:

- Replace every `{{PLACEHOLDER}}` with the project's real values — **never leave an
  unsubstituted `{{...}}`** in a generated file.
- Render generated files in the user's language (Spanish by default at Bambú), keeping
  the structure; code, identifiers, and comments stay in English.
- Keep the guide-comments that explain how to use each section — they serve the next
  person who opens the file.

## GOALS.md (`GOALS.template.md`)

- Goal IDs (G0, G1…) are **immutable** — never renumber. An absorbed/split goal keeps its
  ID with a note ("absorbed by GX").
- Every checked box carries a date `(2026-07-22)` and, when applicable, the PR that
  delivered it.
- Decisions that change scope are noted on the goal with date and decider:
  `**PM decision (2026-07-17): this data ships static**`.
- Unconfirmed assumptions are marked as such: `— this was an assumption, confirm with
  {{WHO}}`.

## MEMORY.md (`MEMORY.template.md`)

- Updated at every session close; keeps the current state + the previous 2–3, archiving
  older entries to `docs/memory-archive.md` (same format).
- Every "current state" bullet carries verification evidence ("verified against the real
  API", "N/N tests green").

## AGENTS.md (`AGENTS.template.md`)

- The Stack and Structure sections come from the applicable stack annex
  (`rules/09`–`rules/11`) or are derived for stacks without one (same categories:
  structure, state, networking, models, style, copy).
- The Security section comes from `rules/08-security-audit.md → Per-project security
  conventions`, adjusted to the stack.

## CLAUDE.md (`CLAUDE.template.md`)

- Delegation only — never add conventions here (see `rules/01-memory-system.md`).

## .github/PULL_REQUEST_TEMPLATE.md (`PULL_REQUEST_TEMPLATE.md`)

- Copy as-is; the functionality checklist is filled per PR with what was actually
  delivered, and the security checklist is answered honestly.

## Per-project API skill

When the project consumes a backend with an OpenAPI/Swagger spec, create
`.claude/skills/{{PROJECT}}-api/SKILL.md` with:

- **description** (frontmatter): triggers on any mention of the project's API, its
  endpoints, or "what does X return" — even without the word "swagger".
- URL of the live spec and a local snapshot (`docs/api/openapi.json` + the `curl` command
  to regenerate it).
- `references/api-map.md`: condensed endpoint list grouped by tag, marking the role
  (`[customer]`, `[admin]`, `[ops]`…), the schema list, and shared conventions (auth
  headers, pagination).
- Central rule: **never guess the endpoint** — if more than one route could apply, list
  the 2–4 candidates and ask. Special care with public/admin pairs of the same resource.
- Efficient-reading rule: never paste the full spec into the conversation; consult the
  map first and the live spec only for point detail.

## docs/plans/

Folder for implementation plans that span sessions (one large goal = one
`docs/plans/gX-{{NAME}}.md`). Free format, but always: context/links (Figma, specs),
tokens or data gathered, and the numbered plan in steps with their checkpoints. The plan
is updated at the close of each checkpoint (what got done, what was deferred and why).
On scaffold, create the folder empty with a one-line README.
