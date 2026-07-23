# Mode C — the work session loop

Every session follows open → work in small, independently reviewable steps that each end
in a developer review checkpoint → close, touching only the active goal.

## Open

1. Read `GOALS.md` and `MEMORY.md` in full. Identify the active goal.
2. **Work only on the active goal.** Do not pull features from future goals forward,
   except interfaces/abstractions already foreseen in the plan. If the user asks for
   something outside the active goal, flag it and agree: does the active goal change, does
   a new goal open, or is it a small fix that needs no goal?
3. If the goal is just starting: new branch from the working branch.

### Canonical pattern

```bash
git checkout develop && git pull && git checkout -b feature/gX-<name>
```

## Work

4. **Plan in small, independently reviewable steps.** Never a single-pass plan of
   models+logic+UI+wiring: split it at natural checkpoints ("add models" / "wire
   repository" / "connect UI"). Goals that span sessions keep their plan in
   `docs/plans/<goal>.md`.
5. **Every step ends in a developer review checkpoint.** When a step is done, STOP and
   wait for approval before the next one — do not chain steps. Why: long unreviewed passes
   accumulate undetected errors; small steps catch them while fixing is still cheap.
6. **Security gate at every checkpoint**: before handing the step to review, run the quick
   checklist in `rules/07-security-gates.md → Checkpoint gate` (secrets, inputs, sensitive
   data, new deps). It takes a minute and keeps insecurity from accumulating.
7. **Challenge & clarify.** If a request is ambiguous, technically questionable, or
   unfeasible, say so and open a short discussion instead of complying silently: state the
   trade-off and agree before building. But do not manufacture friction — if the path is
   clear and the request is sound, just do the work.
8. **Never guess against the backend.** For ambiguous endpoints/fields, list the 2–4
   candidates and ask. An unconfirmed assumption that does get implemented (e.g. a QR
   payload) is explicitly marked as an assumption in `GOALS.md`/`MEMORY.md` with who must
   confirm it.
9. **Mock-first with a swap plan**: when real data doesn't exist yet, build a local mock
   faithful to the design + record the gap and raise it with its owner (backend/PM).
   **Defensive fallback**: a bad asset or external datum degrades the UX — it never breaks
   the critical flow.
10. **Verify live, not just in theory**: besides tests, validate the flow against the real
    API/environment and say so with evidence ("verified on iOS simulator against the real
    API", test booking `XXXX`). Anything unverified is recorded as pending, not assumed good.

## Close

11. Check the delivered boxes in `GOALS.md` (with date).
12. Update `MEMORY.md`: what was done, new decisions (date + who decided), new blockers,
    what's next. Apply the compaction rule (`rules/01-memory-system.md`).
13. **Leave the build green**: static analysis + tests passing. Anything left red is
    documented in MEMORY as an explicit pending item — never silently.
