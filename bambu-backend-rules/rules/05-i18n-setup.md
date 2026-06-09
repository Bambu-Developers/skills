# 05 — i18n setup in every HTTP-facing app

Every `apps/<service>/` that serves HTTP traffic imports `I18nModule.forRoot(...)` in its root module and registers the `I18nValidationPipe` + `I18nValidationExceptionFilter` in both `main.ts` and `serverless.ts`.

## Module setup

```ts
// apps/<service>/src/<service>.module.ts
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    // ...
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver, new HeaderResolver(['x-lang'])],
    }),
  ],
})
export class ExampleModule {}
```

Notes:

- `fallbackLanguage` is **always** `'es'` in this project.
- The `path` is `__dirname + '/i18n/'` so webpack emits the JSON next to the compiled module.
- Both `AcceptLanguageResolver` and `HeaderResolver(['x-lang'])` must be registered.

## Translation files

```
apps/<service>/src/i18n/
├── en/
│   ├── errors.json
│   ├── messages.json
│   └── validation.json
└── es/
    ├── errors.json
    ├── messages.json
    └── validation.json
```

Three buckets, always:

- `errors.json` — used by services when throwing `HttpException`s
- `validation.json` — used by DTO validators (see rule 04)
- `messages.json` — used by services for success/info responses

Both `en/` and `es/` directories must exist and expose the same keys. An existing-only-in-one-language key will silently fall back to the Spanish default at runtime.

## Bootstrap wiring (main.ts AND serverless.ts)

```ts
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';

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
```

The pipe options are **not negotiable** — `whitelist`, `forbidUnknownValues`, `forbidNonWhitelisted`, and `transform` must all be `true`. See rule 10 for the duplication requirement between `main.ts` and `serverless.ts`.

## Rules

1. **Every HTTP-facing app** must call `I18nModule.forRoot(...)` in its root module.
2. **Do not** omit either resolver (`AcceptLanguageResolver`, `HeaderResolver(['x-lang'])`).
3. **Do not** change `fallbackLanguage` — it is `'es'` project-wide.
4. **Do not** split the pipe/filter registration; both belong in `main.ts` and `serverless.ts`.
5. Non-HTTP apps (cron jobs, SNS/S3 triggers) still need `I18nModule.forRoot(...)` if their services throw errors with `i18n.t(...)`.

## Reference

- `apps/posts/src/posts.module.ts`, `apps/posts/src/main.ts`
- `apps/auth/src/auth.module.ts`
- `apps/streaming/src/streaming.module.ts`
