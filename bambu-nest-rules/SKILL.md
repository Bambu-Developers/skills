---
name: bambu-nest-rules
description: Project-specific conventions for the Bambu NestJS monorepo. Load when writing, reviewing, or refactoring any code inside this repo — covers dynamic modules in libs, AWS Secrets Manager integration, typed envs via config/env.config.ts, DTOs with i18n validation, i18n setup in apps, service-layer error handling with i18n, PrismaService usage, dependency injection, and thin-controller structure.
---

# Bambu Backend — Project Rules

This skill captures the **non-negotiable conventions** of the Bambu_Backend monorepo. These rules override generic NestJS advice whenever they conflict. Always consult the matching rule file in `rules/` before writing code in that area.

## When to load this skill

Load this skill whenever you are:

- Creating or editing a NestJS microservice under `apps/<service>/`
- Creating or editing a shared library under `libs/<lib>/`
- Writing a DTO, service, controller, or module in this repo
- Adding a new environment variable or secret
- Wiring an AWS SDK client (S3, SES, SNS, Cognito, Secrets Manager, etc.)
- Reviewing a PR against this repo

Always load it together with `nestjs-best-practices` and `prisma-client-api` when the task touches both domains.

## Rule index

| # | Rule | File |
|---|------|------|
| 1 | Libs must expose `forRoot` / `forRootAsync` dynamic modules | `rules/01-libs-dynamic-modules.md` |
| 2 | Sensitive credentials come from AWS Secrets Manager, wired via `forRootAsync` | `rules/02-secrets-manager.md` |
| 3 | All environment variables are declared and validated in `config/env.config.ts` | `rules/03-env-config.md` |
| 4 | DTOs are mandatory and every validator carries an i18n key | `rules/04-dtos-with-i18n.md` |
| 5 | Every HTTP-facing app bootstraps `I18nModule.forRoot` and uses `I18nValidationPipe` | `rules/05-i18n-setup.md` |
| 6 | Services throw NestJS exceptions with messages from `I18nService.t(...)` | `rules/06-service-error-handling.md` |
| 7 | Use `PrismaService` from `@app/prisma` — never instantiate `PrismaClient` directly | `rules/07-prisma-usage.md` |
| 8 | Dependencies are injected through the constructor, behind module-level tokens | `rules/08-dependency-injection.md` |
| 9 | Controllers are the thinnest possible layer: route → guards → service call | `rules/09-thin-controllers.md` |
| 10 | `main.ts` and `serverless.ts` must carry the same app configuration | `rules/10-main-vs-serverless.md` |
| 11 | Typed third-party SDK errors are mapped to localized responses via `@Catch` filters registered with `APP_FILTER` | `rules/11-exception-filters.md` |

## Quick reference — the ten-line rulebook

```
1.  New lib?            forRoot + forRootAsync + MODULE_OPTIONS token, export only the service.
2.  Secret value?       Store in Secrets Manager, fetch via SecretsManagerService in forRootAsync.
3.  New env var?        Add Zod schema in config/env.config.ts, export the typed value.
4.  New input?          Write a DTO, decorate with class-validator, message: 'validation.*' keys.
5.  New app?            Import I18nModule.forRoot, register I18nValidationPipe in main + serverless.
6.  Service error?      throw new <HttpException>(this.i18n.t('errors.*', { lang })).
7.  DB access?          inject PrismaService, use select over include where possible.
8.  Need config?        inject a module token, not process.env, not a global singleton.
9.  Controller method?  one line: return this.service.doThing(dto, user).
10. Bootstrap config?   whatever you set in main.ts, copy byte-for-byte to serverless.ts.
11. SDK error to render? @Catch(SdkException) + constants map + APP_FILTER + i18n.t(key, { lang }).
```

## How to apply

- Open the relevant `rules/*.md` and follow the shown pattern verbatim, not a generic variant.
- When a convention conflicts with a linter warning or a generic pattern, the convention wins — adjust the code, not the rule.
- When you find code that violates a rule, fix it in the same edit rather than copying the violation.
