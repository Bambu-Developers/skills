# 03 — Environment variables live in config/env.config.ts

All environment variables used anywhere in the monorepo are declared, validated, and re-exported by `config/env.config.ts`. Consumers import the **typed** value, not `process.env`.

## Why

- A single Zod schema enforces presence + type before any microservice boots. Invalid env => `process.exit(1)`.
- Every consumer gets the correctly-typed value (string, number, enum) without repeated coercion.
- Renames / removals surface as TS errors across the whole monorepo in one pass.

## Adding a new variable

1. Open `config/env.config.ts`.
2. Add a field to `EnvSchema`:

   ```ts
   const EnvSchema = z.object({
     // ...
     MY_NEW_FLAG: z.coerce.boolean().default(false).describe('Human-readable purpose'),
   });
   ```

3. Add it to the destructured `export const { ... } = data;` block at the bottom so it becomes importable.
4. Import it where needed:

   ```ts
   import { MY_NEW_FLAG } from '@config/env.config';
   ```

### Zod helpers in use in this file

- `z.string()` — required string
- `z.string().default('…')` — required-with-default
- `z.string().optional()` — may be absent
- `z.url()` / `z.email()` — format validation
- `z.coerce.number()` — numeric env parsed from string
- `z.enum([...])` — closed set of values
- `z.string().describe('...')` — mandatory for readability; shows in error report

## Rules

1. **Never** reference `process.env.X` outside of `config/env.config.ts`. Use the typed export.
2. **Never** fall back silently — declare a `.default(...)` explicitly if a fallback is correct, otherwise let the schema fail fast.
3. **Keep regions separate per service family** (`AWS_S3_REGION`, `AWS_SES_REGION`, …). Do not introduce a single `AWS_REGION`.
4. **Pointers to Secrets Manager go here**, not the secret values (see rule 02).
5. When adding an env var, also add it to the deployment configs (`serverless.yml`, `config.vpc.*.yml`, Dockerfiles if referenced at runtime). A var in `env.config.ts` that isn't wired to the deploy will crash the Lambda on cold start.

## Anti-patterns

```ts
// ❌ Do NOT read process.env directly
const region = process.env.AWS_S3_REGION ?? 'us-west-2';

// ❌ Do NOT coerce at call site
const port = Number(process.env.VALKEY_PORT);

// ❌ Do NOT duplicate the same variable with different names across services
const jwt = process.env.JWT_KEY; // use JWT_SECRET

// ✅ Do this instead
import { AWS_S3_REGION, VALKEY_PORT, JWT_SECRET } from '@config/env.config';
```

## Reference

- `config/env.config.ts` — source of truth
- `config/secrets.interfaces.ts` — typed shapes for Secrets Manager bundles
