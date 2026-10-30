---
name: bambu-nest-security-setup
description: Sets up (or audits) runtime security hardening for any NestJS backend — global DTO validation (whitelist / forbidNonWhitelisted / length limits), input sanitization against stored XSS and injection, rate limiting with @nestjs/throttler (Redis storage, per-endpoint presets, i18n 429), CORS from env allowlist, security headers with helmet (strict CSP, HSTS), and CSRF protection only when it applies (cookie-based auth). Use when the user asks to "harden the backend", "secure the API", "add helmet", "configure CORS", "add rate limiting / throttler", "sanitize inputs", "prevent XSS", "validate DTOs", "add CSRF protection", "security audit of a Nest app", "OWASP checklist for NestJS", or in Spanish "asegurar el backend", "hardening", "configurar CORS", "agregar throttler / rate limit", "sanitizar datos", "validaciones de DTOs", "headers de seguridad", "protección CSRF", "auditar seguridad de la API". Infrastructure-agnostic; for dependency scanning (Snyk) use `bambu-security-setup` instead.
---

# Bambu NestJS — Security Setup

This skill installs or audits the **HTTP/runtime security layer** of a NestJS backend: input validation, sanitization, rate limiting, CORS, security headers, and CSRF (only when it applies). It is project-agnostic — never copy names, domains, headers, or hosting assumptions from any specific project into the target repo. Detect, then parametrize.

## Scope

In scope: `main.ts` bootstrap hardening, a global validation pipe, DTO rules, sanitization utilities, `ThrottlerModule` + guard + decorators, CORS, helmet/CSP, CSRF decision, env vars for all of the above, verification.

Out of scope (defer, don't duplicate):

- Dependency scanning / Snyk → `bambu-security-setup`.
- AuthN/AuthZ design (JWT strategy, CASL ability matrix) → `bambu-nest-rules` rule 10.
- Typed env conventions → `bambu-nest-rules` rule 03 (add the new vars the way that rule says).
- DTO i18n + Swagger decorators → `bambu-nest-rules` rule 04 (rule 02 here adds the *security* constraints on top).
- Deployment target, WAF, TLS termination, secret storage → the consumer repo's infra docs. Never assume them.

## When to load this skill

- "Set up security" on a new Nest repo, or hardening an existing one.
- Adding/changing: helmet, CORS, throttler, global pipes, sanitization, file uploads, cookies/sessions.
- Reviewing a PR that touches `main.ts`, guards, DTOs, or upload endpoints for security.
- Any request phrased as audit/review → run **audit mode**.

## Modes

- **Setup mode** — the repo lacks the protection. Apply the rule, wire env vars, add tests.
- **Audit mode** — read-only first. Produce the checklist from `rules/01-detect-and-audit.md` with ✅ / ⚠️ / ❌ per control and the exact file/line evidence. Apply fixes only after the user picks which ones.

If unsure which mode: start in audit mode (it is read-only).

## Rule index

| # | Rule | File |
|---|------|------|
| 1 | Detect platform/auth/proxy/redis first; audit checklist | `rules/01-detect-and-audit.md` |
| 2 | Global validation pipe + security constraints on every DTO | `rules/02-dto-validation.md` |
| 3 | Sanitize untrusted input on write; safe queries; safe uploads | `rules/03-input-sanitization.md` |
| 4 | Rate limiting with `@nestjs/throttler` (global guard, Redis, presets) | `rules/04-rate-limiting-throttler.md` |
| 5 | CORS from an explicit env allowlist | `rules/05-cors.md` |
| 6 | Security headers with helmet; strict CSP; Swagger exposure | `rules/06-security-headers.md` |
| 7 | CSRF: decision tree — usually N/A with header tokens | `rules/07-csrf-protection.md` |
| 8 | Verify with curl + Jest | `rules/08-verification.md` |

Templates: `templates/bootstrap-security.snippet.md` (consolidated `main.ts`), `templates/env-additions.snippet.md` (env + Zod fields).

## Quick reference

```
1. Always first?     Run rule 01 detection (express|fastify, bearer|cookie auth, behind proxy?, redis?, i18n?).
2. Global pipe?      whitelist + forbidNonWhitelisted + forbidUnknownValues + transform; detailedErrors off in prod.
3. DTO field?        type validator + length/range cap + format validator. Arrays: ArrayMaxSize. Never `any`/bare object.
4. Free text / HTML? Sanitize ON WRITE (plain: strip tags; rich: allowlist). Never sanitize passwords/secrets.
5. Raw SQL?          Tagged `$queryRaw` only; `$queryRawUnsafe`/string concat is forbidden.
6. Uploads?          size limit at the multer layer + allowlisted type verified by magic bytes; no SVG unless sanitized.
7. Throttler?        APP_GUARD global + env-driven limits + Redis if >1 instance + tighter @Throttle on auth/OTP/register.
8. CORS?             Origins from env as explicit list; never '*' with credentials; never '*' in production.
9. Headers?          helmet() on; CSP without 'unsafe-inline'/'unsafe-eval'; disable x-powered-by; Swagger gated in prod.
10. CSRF?            Auth only via Authorization header → not needed (document it). Auth via cookies → required.
11. Trust proxy?     Set it only when behind a proxy, to the exact hop count; otherwise throttling keys on the proxy IP.
12. Done?            Rule 08 checks pass; no protection was weakened "to make it work".
```

## Hard constraints

- **Never weaken a control to silence an error** (e.g. dropping `forbidNonWhitelisted`, adding `'unsafe-inline'`, widening CORS to `*`). Fix the cause or ask the user.
- **Ask before tightening in a live system**: CORS origins, CSP, and `forbidNonWhitelisted` can break existing clients. List what could break, propose a rollout (e.g. CSP report-only first), and get approval.
- **No secrets in code or in this skill's output.** Env var *names* only.
- **Don't invent project specifics.** Header names, origins, throttle numbers come from the target repo's env/config, with the defaults documented in the rules.
- **Match the repo's language** for comments, i18n keys, and docs; follow its alias/layout conventions.
- **Pin-check versions** before writing snippets: read the repo's `package.json` (`@nestjs/throttler` ≥ 6 uses `throttlers: [{ ttl (ms), limit }]`; older versions use seconds and flat `ttl/limit`).
- Never leave an unsubstituted `{{...}}` in files emitted into a repo.
