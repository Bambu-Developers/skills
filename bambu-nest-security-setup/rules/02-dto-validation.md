# 02 — DTO validation: global pipe + security constraints

All input is untrusted. Validation is enforced **globally**, and every DTO field carries a type validator **and** a bound. This rule adds the *security* constraints on top of `bambu-nest-rules` rule 04 (i18n `message:` keys + Swagger decorators still apply — don't drop them).

## Why

- `whitelist` strips unknown properties; `forbidNonWhitelisted` rejects them → blocks mass-assignment (`{"role":"admin"}`).
- `forbidUnknownValues` rejects non-class payloads that would otherwise skip validation silently.
- Unbounded strings/arrays are a cheap DoS and storage-abuse vector.
- TypeScript types vanish at runtime; only decorators protect you.

## Canonical setup

```ts
// main.ts  (use I18nValidationPipe + I18nValidationExceptionFilter if nestjs-i18n is in use; else ValidationPipe)
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    // keep implicit conversion OFF: it turns "false" into true for @IsBoolean-less fields
    transformOptions: { enableImplicitConversion: false },
    stopAtFirstError: false,
  }),
);
```

With i18n:

```ts
app.useGlobalPipes(new I18nValidationPipe({ whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true, transform: true }));
app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: false }));
```

`detailedErrors: false` keeps the response to messages only, without echoing target objects/values back to the client.

Body size cap (Express adapter — set explicitly, don't rely on the default):

```ts
import { json, urlencoded } from 'express';
// If rawBody is needed for webhooks, use NestFactory.create(..., { rawBody: true }) and
// bodyParser: false only if you re-register parsers yourself.
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ extended: false, limit: '1mb' }));
```

## Canonical DTO constraints

```ts
export class CreateThingDto {
  @IsString() @IsNotEmpty() @MaxLength(120)            // every string has an upper bound
  name!: string;

  @IsEmail() @MaxLength(254)
  email!: string;

  @IsUUID('4')                                         // ids: UUID or Int, never bare string
  ownerId!: string;

  @IsEnum(ThingStatus)                                 // closed sets → enum, not string
  status!: ThingStatus;

  @IsInt() @Min(1) @Max(1000)                          // numbers are bounded
  quantity!: number;

  @IsArray() @ArrayMaxSize(50) @ArrayUnique()          // arrays are bounded
  @IsUUID('4', { each: true })
  tagIds!: string[];

  @ValidateNested() @Type(() => AddressDto)            // nested objects: both decorators
  address!: AddressDto;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
```

(Add the `message:` i18n keys and `@ApiProperty` per rule 04 — omitted above only for brevity.)

## Rules

1. **No inline types or `any`** in `@Body()`, `@Query()`, `@Param()`. Query params with more than one field get a DTO; single `@Param('id')` uses `ParseUUIDPipe` / `ParseIntPipe`.
2. **Every string is bounded** (`@MaxLength`); every array (`@ArrayMaxSize`); every number (`@Min/@Max` or `@IsPositive`). Pagination: cap `limit` (e.g. `@Max(100)`).
3. **Never accept server-controlled fields** (role, permissions, ownerId, tenantId, status transitions, timestamps, `isAdmin`) in create/update DTOs. Derive them from the authenticated user/context. With `forbidNonWhitelisted` they're rejected automatically *only if absent from the DTO* — so don't add them.
4. **Update DTOs** use `PartialType` (from `@nestjs/swagger`) of the create DTO — never `PartialType` of an entity or a DTO containing privileged fields.
5. **Format validators over regex** when one exists (`@IsEmail`, `@IsUUID`, `@IsISO8601`, `@IsPhoneNumber`, `@IsUrl({ protocols: ['https'], require_protocol: true })`). When a regex is needed, keep it anchored (`^…$`) and free of nested quantifiers (ReDoS).
6. **Booleans/numbers from query strings**: use `@Transform(({ value }) => value === 'true' || value === true)` + `@IsBoolean()`; avoid implicit conversion.
7. **Passwords**: min length + max length (e.g. 8–128, bounded to protect the hasher), never trimmed or sanitized.
8. **Enums** from the generated ORM client (e.g. Prisma enums) rather than string unions duplicated by hand.
9. **Error responses** must not reveal internals: no stack traces, no ORM error text, no echoed payload in production.

## Anti-patterns

- `@IsOptional()` on a field and nothing else → accepts any type.
- `@Allow()` / `skipMissingProperties: true` / `whitelist: false` "to make a test pass".
- `@Body() body: Record<string, any>` or `@Body() body: any`.
- `forbidNonWhitelisted: false` kept globally because one client sends extra fields — fix that client or scope the exception to that route's pipe.
