# 06 — Security headers with helmet (strict CSP)

`helmet` sets a baseline of response headers (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`/CSP `frame-ancestors`, `Referrer-Policy`, `Cross-Origin-*-Policy`, …) and removes `X-Powered-By`. Mount it **before** routes and other middleware that could send responses.

## Why

- Mitigates MIME sniffing, clickjacking, protocol downgrade, and limits what an injected script can do (CSP).
- An API that returns JSON needs far less CSP than a site; the main CSP consumer is the Swagger UI. Don't grant the whole app Swagger's loosened policy.

## Canonical pattern — API (JSON only)

```ts
import helmet from 'helmet';             // Fastify: @fastify/helmet via app.register

app.disable?.('x-powered-by');           // Express; helmet also removes it
app.use(
  helmet({
    // Strict default for a JSON API: nothing may load or frame.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },   // use 'cross-origin' only if other sites must embed your assets
    referrerPolicy: { policy: 'no-referrer' },
    hsts: { maxAge: 31536000, includeSubDomains: true },   // only effective over HTTPS; see note below
  }),
);
```

## Canonical pattern — Swagger UI

Swagger UI needs inline styles/scripts. **Scope the relaxation to the docs path, and only outside production:**

```ts
const docsEnabled = NODE_ENV !== 'production' || SWAGGER_ENABLED;   // explicit opt-in in prod

if (docsEnabled) {
  app.use('/api/docs', helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],   // Swagger UI bootstrap; limited to this path
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      },
    },
  }));
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs/json' });
}
```

(Order: register the docs-scoped helmet **before** the global one only if the global one would otherwise override it; verify with rule 08 that `/api/docs` renders and every other route carries the strict CSP.)

## Rules

1. **Never `'unsafe-eval'`**, and **no `'unsafe-inline'` or bare `https:` in `scriptSrc`** for API routes. If a front-end is served by this same Nest app, use nonces/hashes instead.
2. **Swagger in production**: disabled by default, or gated (auth, IP allowlist, or env opt-in). It exposes the full attack surface.
3. **HSTS only when the public endpoint is HTTPS** (usually terminated at a proxy/CDN). Don't enable `preload` without telling the user it's effectively irreversible. If TLS is terminated upstream and that layer already sets HSTS, avoid duplicating conflicting values.
4. **Trust proxy** (`app.set('trust proxy', N)`) affects `req.secure`/`req.ip`; set it per rule 04/01, not here by guess.
5. **Rolling out CSP on an existing app that serves HTML**: start with `reportOnly: true`, collect violations, then enforce.
6. Add `Cache-Control: no-store` on responses carrying sensitive data (tokens, PII) via an interceptor or per-route header.
7. `app.use(helmet())` default object spreads are fine, but **don't disable individual helmet middlewares** (`xssFilter`, `noSniff`, `frameguard`…) without a written reason in the PR.
8. Remove/avoid verbose server banners from error pages and keep error bodies generic (rule 02).

## Anti-patterns

- Copying a CSP that includes `'unsafe-inline'` for scripts "because Swagger needs it" into the global policy.
- `helmet({ contentSecurityPolicy: false })` to fix a broken page.
- Leaving Swagger public in production.
