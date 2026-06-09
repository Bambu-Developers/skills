# 10 — main.ts and serverless.ts must stay in sync

Every microservice has two entry points:

- `apps/<service>/src/main.ts` — used by `npm run dev:<service>` for local dev.
- `apps/<service>/src/serverless.ts` — used by the Lambda runtime in deployed environments.

**Golden rule:** whatever you configure on the Nest `app` instance in `main.ts`, you must configure on the `app` in `serverless.ts`. They share **nothing** at runtime.

## Canonical `main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ExampleModule } from './example.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ExampleModule);

  app.set('trust proxy', true);
  app.enableCors();

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
  );

  await app.listen(process.env.port ?? 3001);
}
void bootstrap();
```

## Canonical `serverless.ts`

```ts
import serverlessExpress from '@codegenie/serverless-express';
import { NestFactory } from '@nestjs/core';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ExampleModule } from './example.module';

let server: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ExampleModule);

  app.set('trust proxy', true);
  app.enableCors();

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
  );

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler = async (event: any, context: any, callback: any) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
```

## Checklist

When editing either file, tick every item in both columns:

| In `main.ts` | In `serverless.ts` |
|---|---|
| `NestFactory.create<NestExpressApplication>(...)` | `NestFactory.create<NestExpressApplication>(...)` |
| `app.set('trust proxy', true)` | `app.set('trust proxy', true)` |
| `app.enableCors(...)` | `app.enableCors(...)` |
| `I18nValidationPipe` | `I18nValidationPipe` |
| `I18nValidationExceptionFilter` | `I18nValidationExceptionFilter` |
| Global guards (if any) | Global guards (if any) |
| `app.listen(...)` | `app.init()` + `serverlessExpress({ app: expressApp })` |

## Why this matters

- Missing `trust proxy` in `serverless.ts` → IPs captured behind API Gateway/CloudFront are wrong.
- Missing `enableCors()` in `serverless.ts` → production frontend requests fail CORS while local dev works.
- Missing the i18n pipe in `serverless.ts` → validation errors are emitted as raw strings, breaking localized UIs.

These bugs only manifest post-deploy. Catch them at edit time by updating both files together.

## Reference

- `apps/posts/src/main.ts`
- `apps/auth/src/main.ts`, `apps/auth/src/serverless.ts`
- `docs/MAIN_VS_SERVERLESS_TS.md` (if present)
