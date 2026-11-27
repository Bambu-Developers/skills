# Template — consolidated security bootstrap

Place in `src/common/security/apply-security.ts` (or the repo's equivalent alias) and call it from `main.ts` **and** from e2e test bootstrap. Adapt imports/aliases to the repo; remove sections that rule 01 marked N/A. Read the actual installed versions before finalizing.

Placeholders to resolve from the repo (never leave them in emitted code): `{{ENV_MODULE}}` (the typed config module path), `{{CUSTOM_HEADERS}}` (request headers the app already uses), `{{PROXY_HOPS}}` (exact trusted proxy hops, or delete the line when not behind a proxy).

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import {
  CORS_ALLOWED_ORIGINS,
  NODE_ENV,
  SWAGGER_ENABLED,
  BODY_LIMIT,
  // + USES_COOKIE_AUTH, CSRF_SECRET only if rule 07 says CSRF applies
} from '{{ENV_MODULE}}';

export function applySecurity(app: NestExpressApplication) {
  // Rule 04/01 — only when behind a proxy; exact hop count.
  app.set('trust proxy', {{PROXY_HOPS}});
  app.disable('x-powered-by');

  // Rule 02 — body size caps (keep rawBody on NestFactory.create if webhooks need it).
  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ extended: false, limit: BODY_LIMIT }));

  // Rule 06 — headers. Swagger gets its own scoped relaxation elsewhere (non-prod / opt-in).
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
      hsts: { maxAge: 31536000, includeSubDomains: true },
    }),
  );

  // Rule 05 — CORS.
  const allowed = CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', {{CUSTOM_HEADERS}}],
    credentials: false, // true only with cookie auth (rule 07)
    maxAge: 600,
  });

  // Rule 02 — validation (swap for I18nValidationPipe + I18nValidationExceptionFilter if nestjs-i18n is used).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );
}
```

```ts
// main.ts
const app = await NestFactory.create<NestExpressApplication>(AppModule /*, { rawBody: true } if needed */);
applySecurity(app);
// Swagger setup (gated by NODE_ENV/SWAGGER_ENABLED, scoped CSP) goes after this, per rule 06.
await app.listen(PORT);
```

Throttler lives in `AppModule` (module + `APP_GUARD`), not here — see rule 04.
