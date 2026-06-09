# 02 — AWS Secrets Manager for runtime credentials

Anything that a human would redact from a screenshot (API keys, private keys, DRM secrets, webhook secrets, OAuth app secrets that are **not already in env**) lives in AWS Secrets Manager. The app fetches them through `@app/secrets-manager` at module-bootstrap time via `forRootAsync`.

## What belongs where

| Value type | Source | Example |
|------------|--------|---------|
| Infra constants (regions, ARNs, bucket names, table names, URLs) | `config/env.config.ts` | `AWS_S3_REGION`, `MEDIA_CONVERT_QUEUE_ARN` |
| Low-risk app-level secrets already injected as env | `config/env.config.ts` | `JWT_SECRET`, `COGNITO_CLIENT_SECRET` |
| **Pointers** to secret bundles (the **name** of the secret in Secrets Manager) | `config/env.config.ts` | `AWS_SERVICES_SECRETS`, `ORBI_SECRETS`, `STRIPE_SECRETS`, `FIREBASE_SECRETS`, `DRM_SECRETS` |
| The secret values themselves (opaque JSON payload) | AWS Secrets Manager | Stripe API key, DRM SPEKE URLs, Firebase private key, IVS playback key |

**Rule of thumb:** if the value rotates, varies per deploy, or is sensitive enough that you would not paste it into a PR description, it goes in Secrets Manager. The path to the secret goes in `env.config.ts`.

## Declaring the shape of a secret bundle

Secret payloads are typed in `config/secrets.interfaces.ts`. Extend this file whenever you introduce a new secret bundle.

```ts
// config/secrets.interfaces.ts
export interface IStripeSecrets {
  STRIPE_API_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}
```

## Wiring a lib from secrets (canonical pattern)

```ts
// apps/payments/src/payments.module.ts
import {
  SecretsManagerModule,
  SecretsManagerService,
} from '@app/secrets-manager';
import { StripeModule } from '@app/stripe';
import { IStripeSecrets } from '@config/secrets.interfaces';
import {
  AWS_SECRETS_MANAGER_REGION,
  STRIPE_SECRETS,
} from '@config/env.config';

@Module({
  imports: [
    StripeModule.forRootAsync({
      imports: [
        SecretsManagerModule.forRoot({ region: AWS_SECRETS_MANAGER_REGION }),
      ],
      inject: [SecretsManagerService],
      useFactory: async (secretsManager: SecretsManagerService) => {
        const secrets =
          await secretsManager.getSecretJson<IStripeSecrets>(STRIPE_SECRETS);
        return {
          apiKey: secrets.STRIPE_API_KEY,
          webhookSecret: secrets.STRIPE_WEBHOOK_SECRET,
        };
      },
    }),
  ],
})
export class PaymentsModule {}
```

## Rules

1. **Never** call `getSecretJson` from inside a service method. Secrets are resolved once at boot in `useFactory`.
2. **Always** pass a generic to `getSecretJson<T>` using an interface from `@config/secrets.interfaces`.
3. **Always** import `SecretsManagerModule.forRoot({ region: AWS_SECRETS_MANAGER_REGION })` inline in the async factory's `imports` — do not rely on a global registration.
4. **Never** log or `console.log` the secret payload, including in error paths.
5. **Never** store secrets in `.env` files checked into git; env only holds the **name** of the secret.
6. The region MUST come from `AWS_SECRETS_MANAGER_REGION`. Do not default to other `AWS_*_REGION` values.

## Reference usages in this repo

- `apps/payments/src/payments.module.ts` — Stripe secrets
- `apps/streaming/src/streaming.module.ts` — IVS playback key, DRM/SPEKE config
- `apps/artists/src/artists.module.ts`, `apps/notification-handler/` — Firebase + AWS services secrets
- `apps/notifications/src/notifications.module.ts` — multiple bundles composed together
