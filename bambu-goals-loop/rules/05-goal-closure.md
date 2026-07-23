# Mode D — goal closure

A goal closes with its checklist verified, a pre-PR security audit, a green build, and a
PR to the working branch — and goal IDs are immutable forever.

## Steps

1. Verify the goal's checklist in `GOALS.md`: delivered items checked, deferred items
   moved to another goal or recorded with their reason.
2. **Pre-PR security audit**: full checklist from `rules/07-security-gates.md → Pre-PR`
   over the branch diff.
3. Full green build. Open the PR **into the working branch (`develop`) — never `main`**
   (`main` only if the user names it explicitly for that PR), filling in the repo's
   template with the functionality actually delivered.
4. Mark the goal ✅ with date and PR in `GOALS.md`, agree the next active goal with the
   user, update `MEMORY.md`.
5. **Goal IDs are immutable.** Never renumber an existing goal; if a goal is split or
   absorbed, the old one keeps its ID with a note ("absorbed by GX"). Renumbering breaks
   every reference in MEMORY, PRs, and conversation.
