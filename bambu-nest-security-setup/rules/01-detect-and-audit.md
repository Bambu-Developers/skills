# 01 — Detect the stack first, then audit

Never apply a control before knowing the platform. Several answers below change the code you write (CSRF, trust proxy, Redis storage, adapter-specific helmet/CORS wiring).

## Detection (read-only)

| Question | How to find out | Why it matters |
|----------|-----------------|----------------|
| HTTP adapter: Express or Fastify? | `@nestjs/platform-express` vs `@nestjs/platform-fastify` in `package.json`; `NestFactory.create<...>` in `main.ts` | helmet/CSRF/cookie packages differ (`helmet` vs `@fastify/helmet`) |
| How does the client authenticate? | grep for `JwtStrategy`, `ExtractJwt`, `cookie-parser`, `express-session`, `@fastify/cookie`, `Set-Cookie`, `res.cookie` | Header token → no CSRF. Cookie → CSRF required (rule 07) |
| Behind a reverse proxy / load balancer? | Ask the user; check infra docs, `X-Forwarded-For` usage, existing `trust proxy` | Without correct `trust proxy`, every user shares the proxy IP and throttling breaks |
| More than one app instance? | Ask; check infra docs/scale config | In-memory throttler counters are per-instance → need Redis |
| Redis already available? | `REDIS_URL`, `ioredis`, `@nestjs/cache-manager` in repo | Reuse it for throttler storage |
| i18n in use? | `nestjs-i18n` in deps; `I18nModule.forRoot` | Use `I18nValidationPipe`/filter and i18n 429 message |
| Swagger exposed? | `SwaggerModule.setup` | Needs gating in production (rule 06) |
| File uploads? | `FileInterceptor`, `multer` | Rule 03 upload section |
| Rich text / HTML fields? | DTO fields named `content`, `description`, `html`, `body`, editors in the front | Rule 03 sanitize allowlist |
| Webhooks with signature verification? | `rawBody: true`, signature headers | CSRF/CORS exclusions; keep raw body |
| Monorepo with several Nest apps? | `nest-cli.json` `projects`, `apps/*` | Apply per app `main.ts`; share utils in a lib |

Record the answers; they drive which rules apply. If a question can't be answered from the repo, ask the user once, batching all open questions.

## Audit checklist

Report each line as ✅ present & correct, ⚠️ present but weak, ❌ missing, or ➖ not applicable, with `file:line` evidence.

**Validation (rule 02)**
- [ ] Global validation pipe registered
- [ ] `whitelist: true`, `forbidNonWhitelisted: true`, `forbidUnknownValues: true`, `transform: true`
- [ ] Validation errors don't echo the full constraint tree/values in production
- [ ] Every `@Body`/`@Query`/`@Param` uses a DTO class (no inline types, no `any`)
- [ ] Strings have `@MaxLength`, arrays `@ArrayMaxSize`, numbers `@Min/@Max`, ids `@IsUUID`/`@IsInt`, enums `@IsEnum`
- [ ] Nested objects use `@ValidateNested` + `@Type`
- [ ] Update DTOs can't set server-controlled fields (role, ownerId, status, timestamps)
- [ ] Body size limit configured

**Sanitization (rule 03)**
- [ ] Free-text fields are trimmed/stripped; rich-text goes through an allowlist sanitizer on write
- [ ] No `$queryRawUnsafe` / string-built SQL
- [ ] Uploads: size limit at multer layer, allowlisted types checked by magic bytes, no unsanitized SVG
- [ ] User input never concatenated into logs, emails, or HTML templates unescaped

**Rate limiting (rule 04)**
- [ ] `ThrottlerModule` configured from env; guard registered as `APP_GUARD`
- [ ] Tighter limits on login / OTP / password reset / register / email-or-phone existence checks
- [ ] Shared storage (Redis) if multi-instance
- [ ] `trust proxy` set correctly when behind a proxy
- [ ] Health/readiness endpoints skip throttling

**CORS (rule 05)**
- [ ] Origins come from env as an explicit list
- [ ] No `*` in production; no `*` together with `credentials: true`
- [ ] Methods and headers explicit

**Headers (rule 06)**
- [ ] `helmet()` mounted before routes
- [ ] CSP without `'unsafe-inline'` / `'unsafe-eval'` (except documented Swagger-only, non-prod)
- [ ] `x-powered-by` disabled; HSTS on (when served over HTTPS)
- [ ] Swagger gated or disabled in production

**CSRF (rule 07)**
- [ ] Decision documented (N/A with reason, or implemented)

## Output format (audit mode)

A table `Control | Status | Evidence | Fix`, then a short ordered list of recommended fixes (highest risk first), flagging which ones can break existing clients. Stop and ask which to apply.
