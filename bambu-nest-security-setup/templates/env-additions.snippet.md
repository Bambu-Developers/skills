# Template — env additions for the security layer

Add to the repo's typed config module following `bambu-nest-rules` rule 03 (Zod schema → destructured export). Only add the groups that apply. Values below are **starting defaults** to tune; never commit real secrets — `CSRF_SECRET` and `REDIS_URL` values come from the repo's secret mechanism.

| Variable | Zod field | Default | Used by |
|----------|-----------|---------|---------|
| `NODE_ENV` | `z.enum(['development','test','production']).default('development')` | development | rules 05, 06 |
| `CORS_ALLOWED_ORIGINS` | `z.string().default('')` + production refine (no empty, no `*`) | `''` | rule 05 |
| `BODY_LIMIT` | `z.string().default('1mb')` | 1mb | rule 02 |
| `RATE_LIMIT_ENABLED` | `z.coerce.boolean().default(true)` — careful: `z.coerce.boolean()` treats `"false"` as `true`; use `z.enum(['true','false']).default('true').transform(v => v === 'true')` | true | rule 04 |
| `THROTTLE_TTL_SECONDS` | `z.coerce.number().int().positive().default(60)` | 60 | rule 04 |
| `THROTTLE_LIMIT` | `z.coerce.number().int().positive().default(100)` | 100 | rule 04 |
| `THROTTLE_AUTH_TTL_SECONDS` | `z.coerce.number().int().positive().default(60)` | 60 | rule 04 preset |
| `THROTTLE_AUTH_LIMIT` | `z.coerce.number().int().positive().default(5)` | 5 | rule 04 preset |
| `REDIS_URL` | `z.string().url().optional()` | unset → in-memory + warning | rule 04 |
| `MAX_FILE_SIZE_MB` | `z.coerce.number().positive().default(5)` | 5 | rule 03 uploads |
| `SWAGGER_ENABLED` | boolean-from-string as above, default `'false'` | false | rule 06 |
| `USES_COOKIE_AUTH` | boolean-from-string, default `'false'` | false | rules 05, 07 |
| `CSRF_SECRET` | `z.string().min(32)` (required only when CSRF applies) | — | rule 07 |

Notes:

- Add one `THROTTLE_<PRESET>_TTL_SECONDS` / `THROTTLE_<PRESET>_LIMIT` pair per extra preset (register, lookup, heavy).
- Update `.env.example` (and the repo's env docs) with every new variable, with empty/placeholder values for secrets.
- Where the values are injected in each environment (CI vars, secret store, orchestrator config) is outside this skill — tell the user which variables must exist, and stop there.
