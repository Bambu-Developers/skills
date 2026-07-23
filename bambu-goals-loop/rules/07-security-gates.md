# Security gates — checkpoint and pre-PR

Security operates at every checkpoint (1-minute gate on the step's code) and at goal
closure (pre-PR checklist on the full branch diff) — never as a separate phase. The third
level, the full audit, lives in `rules/08-security-audit.md`.

## Checkpoint gate

Before handing each step to review, check ONLY the step's code:

- [ ] **Secrets**: no API key, token, password, or credentialed URL in code. Sensitive
      config goes through environment variables / dart-define / CI secrets.
- [ ] **Inputs**: every incoming datum (user, API, file, deep link) is validated with
      centralized types/validators — never ad-hoc regex/checks at the call site.
- [ ] **Sensitive data**: no PII, tokens, or full payloads in logs (`print`,
      `console.log`, `Log.d`). Network logging in debug builds only.
- [ ] **New dependencies**: before adding a lib, verify active maintenance, adoption, and
      known vulnerabilities. A new dep is new attack surface — if in doubt, raise it with
      the user before adding it.
- [ ] **Errors**: user-facing messages leak no internals (stack traces, SQL, paths);
      detail goes to the development log.

## Pre-PR (goal closure)

Everything in the gate, applied to the **full branch diff**, plus:

- [ ] Grep the diff for secret patterns (`key`, `secret`, `token`, `password`, `Bearer `,
      long base64 strings) and for hardcoded endpoints outside config.
- [ ] AuthN/AuthZ: new routes and actions respect session/role rules; no admin endpoint
      consumed from an end-user app without explicit confirmation.
- [ ] Storage: session/sensitive data in the platform's secure storage
      (Keychain/Keystore/secure storage), never in plain preferences/localStorage.
- [ ] Debug tooling (network profilers, verbose logging, hidden menus) excluded from
      release by construction (not by convention).
- [ ] Dependency audit with the stack's tool (`npm audit`, `dart pub outdated`,
      `gradle dependencyCheck`, `pip-audit`…) — high/critical vulnerabilities are resolved
      or documented as a blocker with an owner in `MEMORY.md`.
- [ ] Money/precision rules: amounts in exact decimals or integer cents — never binary
      floats.
- [ ] The PR template's security checklist is filled honestly — if something doesn't
      apply or didn't pass, say so.
