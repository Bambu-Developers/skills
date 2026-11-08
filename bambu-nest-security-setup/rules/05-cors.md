# 05 — CORS from an explicit env allowlist

CORS tells browsers which origins may read responses from the API. It is **not** authentication and does not stop non-browser clients. Configure it narrowly.

## Why

- `origin: '*'` lets any website's JS call the API from a victim's browser (dangerous with cookies or with tokens held in JS-accessible storage that an XSS can use).
- Browsers forbid `*` together with `credentials: true`; a "reflect any origin" workaround (`origin: true`) is equivalent to `*` + credentials and is **forbidden**.

## Canonical pattern

```ts
// config: CORS_ALLOWED_ORIGINS — comma-separated, exact origins (scheme + host + port), e.g. "https://app.example.com,https://admin.example.com"
const allowedOrigins = CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

app.enableCors({
  origin: (origin, cb) => {
    // Non-browser clients (curl, server-to-server, mobile native) send no Origin: let them through;
    // CORS is a browser control and auth protects the endpoint.
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);                       // no CORS headers → browser blocks; do NOT throw (avoids 500s)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', /* + the app's custom request headers, e.g. language, device, version */],
  exposedHeaders: [/* only headers the front must read, e.g. 'Retry-After' */],
  credentials: allowedOrigins.length > 0 && /* app uses cookies */ USES_COOKIE_AUTH,
  maxAge: 600,                                    // cache preflight 10 min
});
```

## Env validation (see `templates/env-additions.snippet.md`)

```ts
CORS_ALLOWED_ORIGINS: z.string()
  .default('')
  .refine(
    (v) => NODE_ENV !== 'production' || (v.trim() !== '' && !v.split(',').some((o) => o.trim() === '*')),
    'CORS_ALLOWED_ORIGINS must be an explicit list (no "*") in production',
  ),
```

## Rules

1. **Production: explicit origins only.** Fail fast at startup if the list is empty or contains `*`.
2. **Dev**: allow `http://localhost:<port>` entries via the same env var — never a code branch that opens everything.
3. **`credentials: true` only if the app really uses cookies** (rule 07) — otherwise leave it off.
4. **List custom request headers explicitly** (`allowedHeaders`); a missing one fails preflight, an `'*'` widens the surface. Read the repo for headers it already uses (language, platform, device id, tenant) instead of inventing names.
5. **Exact matches**, not substring/`endsWith` checks (`evil-example.com` would pass `endsWith('example.com')`). If wildcard subdomains are required, match a strict anchored regex like `^https:\/\/[a-z0-9-]+\.example\.com$`.
6. **Same origin per environment**: staging and prod have separate lists via env.
7. Server-to-server webhooks don't need CORS; don't widen it for them.
8. Changing CORS in a live system can break clients — list current front-end origins with the user first (hard constraint in `SKILL.md`).

## Anti-patterns

- `app.enableCors()` with no options (defaults to `*`).
- `origin: true` / reflecting `req.headers.origin` unconditionally.
- Using CORS as the only protection for a sensitive endpoint.
