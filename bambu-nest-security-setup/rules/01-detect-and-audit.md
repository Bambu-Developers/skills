# 01 — Detect the stack, check/install dependencies, then audit

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

## Dependency check & install (setup mode)

Every control needs packages. **Before writing any code**, verify they are installed and install what's missing — otherwise the code you emit won't compile.

### Step 1 — detect the package manager and workspace

| Signal | Manager | Install command |
|--------|---------|-----------------|
| `pnpm-lock.yaml` | pnpm | `pnpm add <pkg>` / `pnpm add -D <pkg>` |
| `yarn.lock` + `.yarnrc.yml` | yarn berry | `yarn add <pkg>` / `yarn add -D <pkg>` |
| `yarn.lock` (no `.yarnrc.yml`) | yarn classic | `yarn add <pkg>` / `yarn add -D <pkg>` |
| `bun.lock` / `bun.lockb` | bun | `bun add <pkg>` / `bun add -d <pkg>` |
| `package-lock.json` (or none) | npm | `npm install <pkg>` / `npm install -D <pkg>` |

Use the repo's manager only — never mix lockfiles. In a monorepo (`apps/*`, workspaces), install in the workspace that owns the Nest app (e.g. `pnpm --filter <app> add …`, `yarn workspace <app> add …`, `npm i -w <app> …`), or at the root when the repo keeps a single shared `package.json`.

### Step 2 — compute what's needed

Read `package.json` (`dependencies` + `devDependencies`) and the installed Nest major (`@nestjs/common`). Needed set depends on the detection answers above:

| Package | Needed when | Dev? |
|---------|-------------|------|
| `class-validator`, `class-transformer` | always (rule 02) | no |
| `helmet` (Express) / `@fastify/helmet` (Fastify) | always (rule 06) | no |
| `@nestjs/throttler` | always (rule 04) | no |
| `@nest-lab/throttler-storage-redis` | more than one instance **and** Redis available (or user wants it) | no |
| `sanitize-html` + `@types/sanitize-html` | any free-text/rich-text field (rule 03) | types: yes |
| `file-type` | file uploads (rule 03) | no |
| `@types/multer` | file uploads on Express | yes |
| `cookie-parser` (+ `@types/cookie-parser`) and `csrf-csrf` (Express) / `@fastify/cookie` + `@fastify/csrf-protection` (Fastify) | **only** if rule 07 decided CSRF applies | types: yes |
| `supertest`, `@types/supertest` | rule 08 e2e specs and the repo has no e2e setup | yes |
| `zod` | only if the repo already uses the Zod config module; otherwise follow the repo's existing env validation | no |

Already-present packages are **not** reinstalled or upgraded; if one is present but outside a compatible range (e.g. `@nestjs/throttler` < 6 → different `ttl` units/`throttlers` shape), report it and ask before bumping.

### Step 3 — check compatibility before installing

- `npm view <pkg> peerDependencies` (or the manager's equivalent) for each new package and compare with the installed `@nestjs/common` / `@nestjs/core` / `@nestjs/throttler` majors. Choose the newest version whose peers match; don't take `latest` blindly.
- `file-type` ≥ 17 is **ESM-only**: if the repo compiles/tests as CommonJS (check `tsconfig` `module`, Jest transform), either use a CJS-compatible version or dynamic `import()` as in rule 03 — and say which.
- Same CJS/ESM check for `sanitize-html` and any package a test runner can't load; if a version must be pinned, pin it **exactly** and comment why.
- Don't introduce a second package that duplicates an existing one (e.g. another sanitizer, another rate limiter).

### Step 4 — install

1. Show the user the exact list: package, version range, why, dev/prod, and the command(s) that will run. In **audit mode** stop here and report the missing ones as ❌ — **don't install in audit mode**.
2. In **setup mode**, run the install with the detected manager (one command for prod deps, one for dev deps). Respect the repo's registry/auth config (`.npmrc`); don't edit it.
3. Don't hand-edit `package.json` or lockfiles — let the manager do it so the lockfile stays consistent.
4. After installing, confirm: the packages appear in `package.json`, the lockfile changed, and the project still type-checks/builds (`tsc --noEmit` or the repo's build script). If the build breaks because of a new dependency, fix or report it before moving on; don't continue with rule setup on a broken build.
5. If the install fails (network, peer conflict, private registry), report the exact error and stop — don't retry with `--force`/`--legacy-peer-deps` without asking.

Reminder for the final report: list which dependencies were already there, which were installed (with versions), and which were skipped as N/A.

## Audit checklist

Report each line as ✅ present & correct, ⚠️ present but weak, ❌ missing, or ➖ not applicable, with `file:line` evidence.

**Dependencies (this rule)**
- [ ] All packages the applicable controls need are installed (table above)
- [ ] Installed versions are compatible with the repo's Nest major (e.g. `@nestjs/throttler` ≥ 6)
- [ ] No deprecated packages in use (e.g. `csurf`)

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
