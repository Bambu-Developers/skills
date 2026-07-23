# Mode B — retrofit an existing project

Same as mode A, but **first survey what already exists** — a retrofit documents reality,
not aspiration.

## Steps

1. Explore the repo: actual stack, actual structure, implicit conventions (naming, where
   models/state/networking live), test and CI status, existing branches.
2. `AGENTS.md` documents the project's **real** conventions. Where current practice
   contradicts a good practice, do not "fix" it silently: record it as the standing
   convention and raise the improvement as a goal or a pending-refactor note (pattern:
   "pending refactor: migrate the file the next time you touch it; do not refactor
   everything in one pass").
3. `GOALS.md` rebuilds the history: what was already delivered becomes closed goals ✅
   (coarse-grained is fine), work in progress is the active goal, what's pending becomes
   future goals.
4. `MEMORY.md` starts from the real current state: known debt, blockers, decisions
   recoverable from PRs/commits.
5. Run the full security audit checklist (`rules/08-security-audit.md`) and record
   findings as goals or blockers.
