# 11 — Exception filters for typed third-party errors

When a third-party SDK throws a domain-specific exception class (AWS, Stripe, Firebase, …) that we want mapped to a localized HTTP response, write a `@Catch(...)` filter and register it via `APP_FILTER`. Never scatter `try / catch` over the Cognito/Stripe error name across services.

## Canonical filter

```ts
// apps/auth/src/filters/cognito.filter.ts
import { CognitoIdentityProviderServiceException } from '@aws-sdk/client-cognito-identity-provider';
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CognitoExceptionFilterMap } from '../constants/cognito-exeptions.constant';

@Catch(CognitoIdentityProviderServiceException)
export class CognitoFilter implements ExceptionFilter {
  private readonly logger = new Logger(CognitoFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(
    exception: CognitoIdentityProviderServiceException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, message: messageKey } =
      CognitoExceptionFilterMap[exception.name] ??
      CognitoExceptionFilterMap.DEFAULT;

    const message = this.i18n.t(messageKey, {
      lang: I18nContext.current()?.lang,
    });

    this.logger.error(
      `Cognito Error ${exception.name}: ${exception.message}`,
    );

    response.status(status).json({ statusCode: status, message });
  }
}
```

## Exception → (status, i18n key) map

Keep the mapping in `apps/<service>/src/constants/<name>-exceptions.constant.ts`. Always include a `DEFAULT` branch so unknown codes land on 500 + a generic translation key — never on an untranslated English message.

```ts
// apps/auth/src/constants/cognito-exeptions.constant.ts
import { HttpStatus } from '@nestjs/common';

export interface IExceptionFilterMap {
  status: number;
  message: string;
}

export type ExceptionFilterMap = { [key: string]: IExceptionFilterMap };

export const CognitoExceptionFilterMap: ExceptionFilterMap = {
  UsernameExistsException: {
    status: HttpStatus.CONFLICT,
    message: 'cognito.EXCEPTIONS.UsernameExistsException',
  },
  NotAuthorizedException: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'cognito.EXCEPTIONS.NotAuthorizedException',
  },
  // ...
  DEFAULT: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'cognito.EXCEPTIONS.DEFAULT',
  },
};
```

The corresponding translations live under their own namespace in `i18n/{en,es}/` (e.g. `cognito.json`) so the keys `cognito.EXCEPTIONS.*` resolve regardless of the request language.

## Registration

Register the filter as a DI-backed global via `APP_FILTER` in the owning module. **Do not** `app.useGlobalFilters(new CognitoFilter(...))` — that bypasses DI and you won't have `I18nService` in the constructor.

```ts
// apps/auth/src/auth.module.ts
import { APP_FILTER } from '@nestjs/core';
import { CognitoFilter } from './filters/cognito.filter';

@Module({
  providers: [
    // ...
    { provide: APP_FILTER, useClass: CognitoFilter },
  ],
})
export class AuthModule {}
```

## Rules

1. **One filter per SDK exception root class.** Use the SDK's most specific catchable base (`CognitoIdentityProviderServiceException`, `Stripe.errors.StripeError`, etc.). Do not `@Catch()` bare — that swallows everything including the validation filter.
2. **Always resolve the message via `i18n.t(key, { lang: I18nContext.current()?.lang })`**. Never inline English strings in the JSON response.
3. **Always include a `DEFAULT` mapping** keyed under the same namespace so new unmapped SDK errors degrade gracefully.
4. **Register via `APP_FILTER` provider**, not via `app.useGlobalFilters(...)`, so the filter participates in DI.
5. **Log once at `logger.error(...)`** — do not duplicate with `console.log`, and do not log the secret body of requests.
6. **Response shape is `{ statusCode, message }`** to match the default HTTP exception output. If you add fields, add them consistently across filters.
7. **Filter lives in `apps/<service>/src/filters/`** alongside its constants in `apps/<service>/src/constants/`.
8. **Do not translate inside the thrown error in the service** — keep services throwing the raw SDK exception (or rethrow) so the filter is the single translation point.
9. **Do not stack two filters that catch overlapping types.** If you extend the Cognito filter, update the map rather than adding a second filter.

## Where this pattern applies next

Use the same recipe for any future SDK that throws typed errors you want to render uniformly:

| SDK error class | Candidate filter location |
|-----------------|---------------------------|
| `Stripe.errors.StripeError` | `apps/payments/src/filters/stripe.filter.ts` |
| `FirebaseError` (FCM) | wherever Firebase is consumed |
| Prisma `Prisma.PrismaClientKnownRequestError` | consider an app-level filter when you want to translate unique-constraint violations |

## Reference

- `apps/auth/src/filters/cognito.filter.ts` — canonical filter
- `apps/auth/src/constants/cognito-exeptions.constant.ts` — canonical mapping
- `apps/auth/src/auth.module.ts` — `APP_FILTER` registration
