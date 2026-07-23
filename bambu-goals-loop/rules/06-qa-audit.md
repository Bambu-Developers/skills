# Mode E — QA / audit

Analyze a project (own or third-party) without necessarily developing in it, and deliver
prioritized findings backed by file:line evidence.

## Steps

1. **Survey**: stack, structure, implicit conventions, test/CI status.
2. **Quality**: consistency with its own conventions, duplication, error handling, test
   coverage on critical flows, hardcoded copy, dead TODOs.
3. **Security**: full checklist from `rules/08-security-audit.md` (apply the section for
   the project type: mobile, web, backend).
4. **Deliverable**: report with prioritized findings (critical/high/medium/low), each with
   evidence (`file:line`), impact, and concrete remediation. If the project will adopt the
   methodology, findings become goals (chain into mode B, `rules/03-retrofit.md`).
