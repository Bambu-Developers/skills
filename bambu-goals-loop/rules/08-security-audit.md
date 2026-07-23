# Full security audit and per-project conventions

For retrofit (mode B), QA (mode E), or periodic review: run a grounded OWASP Top 10
checklist and deliver prioritized findings with file:line evidence; every `AGENTS.md`
carries a fixed security-conventions section.

## Full audit checklist (grounded OWASP Top 10)

1. **Access control**: does every sensitive operation verify permissions on the server
   (not just hide the button)? Predictable resource IDs without ownership checks (IDOR)?
2. **Cryptography and data**: TLS on all traffic? Certificates validated (no
   `badCertificateCallback`/`trustAllCerts`)? Sensitive data encrypted at rest? Obsolete
   algorithms (MD5/SHA1 for security)?
3. **Injection**: parameterized queries? Escaped output (XSS)? System commands with user
   input? Deserialization of untrusted data?
4. **Insecure design**: critical flows (payment, auth, deletion) with confirmation and no
   inconsistent states? Rate limiting where it applies?
5. **Misconfiguration**: security headers (web)? Open CORS? Debug mode in release?
   Verbose error messages in production? Excessive app permissions (mobile)?
6. **Vulnerable dependencies**: full audit + update policy.
7. **Authentication**: password policy? Tokens with expiry and correct refresh?
   Invalidatable sessions? Secure token storage?
8. **Integrity**: does CI verify what it deploys? Lockfiles versioned? Third-party
   scripts with integrity (web)?
9. **Logging and monitoring**: are security events logged (failed logins, permission
   changes) without logging secrets/PII?
10. **SSRF/requests**: URLs built from user input validated against an allowlist?

Deliverable: prioritized findings (critical/high/medium/low) with `file:line` evidence,
impact, and concrete remediation.

## Per-project security conventions (for `AGENTS.md → Security`)

### Canonical pattern

Paste this (adjusted to the stack) into `AGENTS.md`:

```markdown
## Security

- **Secrets never in the repo**: sensitive config via {{dart-define / gitignored .env +
  .env.example / CI secrets}}. If a secret was committed, rotate it — deleting it from
  history is not enough.
- **Tokens/session** in {{flutter_secure_storage / Keystore / httpOnly+secure cookie}} —
  never in plain {{SharedPreferences / localStorage}}.
- **Centralized input validation** in {{lib/shared/forms/ / framework validators}}: never
  ad-hoc checks at the call site.
- **Network**: TLS always; logging/profiling interceptors in debug only, excluded from
  release by build config.
- **Logs without PII or tokens** in any build.
- **Money**: {{BigDecimal / integer cents / Decimal}} — never Double/float.
- **Dependencies**: verify maintenance and vulnerabilities before adding; audit at every
  goal closure.
- **Generic user-facing errors**; technical detail only in the development log.
```

## Per-project-type specifics

### Mobile (condensed MASVS)

- Storage: nothing sensitive in plain text or in uncontrolled automatic backups;
  Keychain/Keystore for credentials. Note: the iOS Keychain **survives uninstall** — plan
  for it in logout/reset.
- Network: TLS + consider certificate pinning in apps with payments; no cleartext traffic.
- Platform: minimal permissions; deep links/intents validated; WebViews without
  unnecessary `javascriptInterface` and never loading arbitrary content.
- Code: obfuscation/minification in release (R8/ProGuard); debug flags out of release;
  basic root/jailbreak detection only if the business requires it.
- Binary: never embed secrets (they're extracted with `apktool` in minutes) — the secret
  lives in the backend.

### Web

- XSS: escape output by default (framework); `dangerouslySetInnerHTML`/`innerHTML` only
  with sanitization; CSP.
- CSRF: tokens on mutations with session cookies; `SameSite`.
- Session cookies `httpOnly`, `secure`, reasonable expiry.
- Headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`, HSTS.
- CORS: explicit allowlist, never `*` with credentials.
- Uploads: validate type/size on the server; serve from a separate domain/bucket.

### Backend/API

- AuthZ on every endpoint (never trust the client); scopes/roles verified server-side.
- Rate limiting on auth and expensive endpoints.
- Payload validation with schemas (DTOs); reject extra fields on sensitive operations.
- Secrets per environment (vault/secrets manager); rotation possible.
- Parameterized queries / ORM; no concatenated SQL.
