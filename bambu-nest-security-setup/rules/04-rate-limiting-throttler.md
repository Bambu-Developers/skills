# 04 — Rate limiting with `@nestjs/throttler`

One global guard + env-driven defaults + tighter presets on abusable endpoints + shared storage when running more than one instance.

## Why

- Blocks brute force (login, OTP, password reset), enumeration (email/phone existence checks), scraping, and cheap DoS.
- In-memory counters are **per instance**; with N instances the effective limit is N× → use Redis.
- Behind a proxy, the default tracker (`req.ip`) is the proxy's IP unless `trust proxy` is set → everyone shares one bucket.

## Dependencies

`@nestjs/throttler` (≥ 6: `ttl` in **milliseconds**, `throttlers: []`), and when multi-instance `@nest-lab/throttler-storage-redis`. Check the installed major before writing code.

## Canonical setup — module

```ts
// app.module.ts
ThrottlerModule.forRootAsync({
  useFactory: (): ThrottlerModuleOptions => {
    const throttlers = [{ ttl: THROTTLE_TTL_SECONDS * 1000, limit: THROTTLE_LIMIT }];
    if (!RATE_LIMIT_ENABLED) return { throttlers, skipIf: () => true };

    if (!REDIS_URL) {
      new Logger('ThrottlerModule').warn(
        'REDIS_URL not set — rate-limit counters are in-memory and per instance.',
      );
      return { throttlers };
    }
    return { throttlers, storage: new ThrottlerStorageRedisService(REDIS_URL) };
  },
}),
```

Env vars come from the typed config module (see `bambu-nest-rules` rule 03 and `templates/env-additions.snippet.md`). Never read `process.env` inline.

## Canonical setup — global guard

```ts
// app.module.ts providers
{ provide: APP_GUARD, useClass: AppThrottlerGuard },
```

```ts
// common/guards/app-throttler.guard.ts
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  // Count per credential when the caller is an API client; per IP otherwise.
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const apiKeyId = req?.user?.apiKeyId;
    return apiKeyId ? `api-key:${apiKeyId}` : super.getTracker(req);
  }

  // Localized 429 when nestjs-i18n is present; plain English otherwise.
  protected async throwThrottlingException(): Promise<void> {
    const message =
      I18nContext.current()?.t('errors.GENERAL.TOO_MANY_REQUESTS') ??
      'Too many requests. Please try again later.';
    throw new ThrottlerException(message);
  }
}
```

Design notes:

- Register it as **`APP_GUARD`** only once. A second `ThrottlerGuard` on a controller consumes the quota twice, and guards declared at method level run *after* global guards — so `req.user` is **not** populated yet when a global throttler computes the tracker. If you need per-user tracking, either key on something present pre-auth (IP, API-key header) or resolve identity inside `getTracker` explicitly. Don't assume `req.user` exists.
- Drop the `getTracker` override entirely if you have no non-IP identity; keep the class only for the i18n message.

## Canonical pattern — presets for sensitive endpoints

```ts
// common/decorators/throttle-auth.decorator.ts
export const ThrottleAuth = () =>
  Throttle({ default: { limit: THROTTLE_AUTH_LIMIT, ttl: THROTTLE_AUTH_TTL_SECONDS * 1000 } });
```

```ts
@ThrottleAuth()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

Create one named preset per risk class, each backed by its own env vars:

| Preset | Endpoints | Typical starting point |
|--------|-----------|------------------------|
| `ThrottleAuth` | login, OTP send/verify, password reset | 5–10 / minute |
| `ThrottleRegister` | sign-up | 3–5 / 10 minutes |
| `ThrottleLookup` | "does this email/phone exist" | 5–10 / minute |
| `ThrottleHeavy` | exports, PDF/report generation, search with wide scans | 5–20 / minute |
| default (global) | everything else | 60–120 / minute |

Numbers are *starting points* — take the real values from env, tune with traffic data, and tell the user they are defaults.

Additional per-identity limits (e.g. N reset emails per address per hour) can't be expressed by an IP-keyed throttler: add a small service backed by the same Redis/DB, keyed on the identity, and throw the same exception type.

## Other rules

- `@SkipThrottle()` on health/readiness/metrics endpoints only; never on auth.
- Set `app.set('trust proxy', N)` where `N` is the **exact** number of trusted proxy hops, and only when actually behind proxies (rule 01). `true` or a too-large number lets clients spoof `X-Forwarded-For` and evade limits.
- Webhooks from known providers: either skip throttling and verify signatures, or give them a generous dedicated preset — don't let the default limit silently drop legitimate retries.
- Response should include `Retry-After` (the throttler sets `Retry-After` and `X-RateLimit-*` headers by default in v6 — verify).
- Rate limiting is not a substitute for account lockout/backoff on credentials; mention it to the user if absent.
