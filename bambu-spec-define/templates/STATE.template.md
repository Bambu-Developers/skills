# {{BOARD_TITLE}}

> **Generated:** {{DATE}} · branch `{{BRANCH}}` · ref `{{COMMIT}}`
>
> Snapshot of every spec in this directory. Everything between the `spec-state:generated`
> markers is rebuilt from the spec files themselves — never hand-edit it, and never treat it
> as the source of truth: if a row and a spec file disagree, **the file wins**. The sections
> below the end marker are written by hand and survive every regeneration.
>
> Regenerate with **bambu-spec-define**; verify with `scripts/state-check.sh`.

<!-- spec-state:generated:start -->

## Status table

📝 Draft · 👀 In review · 🟢 Approved · ✅ Implemented · 🗃️ Obsolete

| # | Spec | Status | Depends on | Ref |
| --- | --- | --- | --- | --- |
{{STATUS_ROWS}}

**Summary:** {{SUMMARY_COUNTS}}

## Ready to implement

{{READY}}

## Blocked

{{BLOCKED}}

## Critical path

{{CRITICAL_PATH}}

## Dependency graph

```
{{ASCII_GRAPH}}
```

{{MERMAID_GRAPH}}

<!-- spec-state:generated:end -->

## Reading the board

{{NARRATIVE}}

## Project notes

{{PROJECT_NOTES}}
