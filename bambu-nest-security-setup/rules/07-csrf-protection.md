# 07 — CSRF protection: only when it applies

CSRF abuses the browser's **automatic** credential attachment (cookies, HTTP auth). If the API never authenticates a request from something the browser attaches automatically, there is nothing to forge. **Don't add CSRF middleware by reflex** — decide, then document the decision.

## Decision tree

```
How are state-changing requests authenticated?
│
├─ Only via an `Authorization: Bearer …` header (or custom header / API key header)
│    set explicitly by client code, token NOT in a cookie
│      → CSRF NOT REQUIRED. Document it (see "N/A note"). Still: strict CORS (rule 05), no XSS (rule 03/06).
│
├─ Via cookies (session cookie, JWT/refresh token in a cookie, `express-session`)
│      → CSRF REQUIRED. Implement "Cookie-based auth" below.
│
└─ Mixed (e.g. refresh token in cookie, access token in header)
       → CSRF REQUIRED on every endpoint that reads the cookie (refresh/logout/session routes).
```

Detection is done in rule 01 (`cookie-parser`, `res.cookie`, `Set-Cookie`, `express-session`, `@fastify/cookie`, cookie extractors in the JWT strategy). If it can't be determined, ask.

## N/A note (when header-token auth only)

Add a short comment in `main.ts` (or the repo's security doc) so nobody "fixes" it later:

```ts
// CSRF: not applicable — auth is a bearer token in the Authorization header (never a cookie),
// which browsers don't attach cross-site automatically. Revisit if cookie-based auth is introduced.
```

Reinforce the assumption: `credentials` stays `false`/unset in CORS, and no endpoint reads `req.cookies` for auth.

## Cookie-based auth — required controls (defense in depth, in this order)

1. **Cookie attributes** on every auth cookie: `HttpOnly`, `Secure` (HTTPS), `SameSite=Lax` (or `Strict` if UX allows; `None` only for genuine cross-site embeds, which then makes the token below mandatory), explicit `Path`, short `Max-Age`.
2. **CORS**: exact origin allowlist + `credentials: true` (rule 05). Never `*`.
3. **Safe methods are safe**: no state change on `GET`/`HEAD`/`OPTIONS`.
4. **Anti-CSRF token — double-submit cookie (stateless)** for all unsafe methods (`POST/PUT/PATCH/DELETE`).
5. **Origin/Referer check** as an extra layer: reject unsafe requests whose `Origin` (fallback `Referer`) isn't in the allowlist.

**Don't use `csurf`** — it is deprecated/archived. Use a maintained double-submit implementation (e.g. `csrf-csrf` on Express; `@fastify/csrf-protection` on Fastify). Check the current package state and the repo's Nest/adapter versions before installing.

### Canonical setup (Express + `csrf-csrf`, sketch — verify API against the installed version)

```ts
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => CSRF_SECRET,                         // from typed env; never hard-coded
  getSessionIdentifier: (req) => req.user?.sessionId ?? req.ip,  // bind the token to the session if one exists
  cookieName: '__Host-csrf',                            // __Host- prefix requires Secure + Path=/ + no Domain
  cookieOptions: { sameSite: 'lax', secure: NODE_ENV === 'production', httpOnly: true, path: '/' },
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

app.use(cookieParser());
app.use(doubleCsrfProtection);        // after cookieParser, before routes

// endpoint the SPA calls once at startup / after login to obtain the token
@Get('csrf-token')
csrfToken(@Req() req, @Res({ passthrough: true }) res) {
  return { token: generateToken(req, res) };
}
```

The client sends the token in the `X-CSRF-Token` header (add it to CORS `allowedHeaders`).

### Exclusions

- **Webhooks** from external providers (no cookies, authenticated by signature): exclude their routes from the CSRF middleware and verify the signature against the **raw body** instead.
- **Pure token-auth routes** (e.g. API-key endpoints for partners) that don't read cookies: exclude them explicitly and keep the list short and commented.
- Never exclude a route just because a test fails.

## Rules

1. Decision first, code second: record "N/A because …" or the implemented design.
2. `SameSite` alone is not enough (it doesn't cover same-site subdomain attacks or `None`); keep the token for cookie auth.
3. Token secret from env, rotated like any secret; failure to validate → `403`, with a generic message.
4. Login CSRF: apply the same protection to the login endpoint when sessions are cookie-based.
5. Test it (rule 08): a cross-origin POST without the token must fail; with a valid token must pass.
