# 04 — DTOs with i18n validation messages

Every inbound payload — `@Body()`, `@Query()`, `@Param()` — is validated through a DTO class. Every `class-validator` decorator carries a `message:` pointing to an i18n key.

## Why

- The global `I18nValidationPipe` + `I18nValidationExceptionFilter` translate these keys at runtime based on the `Accept-Language` / `x-lang` header.
- Missing a `message:` key leaks the raw class-validator default into the response in whatever language it was authored in, breaking localization.
- `@Body('fieldName')`-style extraction bypasses the pipe entirely, skipping validation and transformation.

## Canonical DTO

```ts
// apps/<service>/src/dto/create-post.dto.ts
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostVisibility } from 'generated/prisma/client';

export class CreatePostDto {
  @IsUUID('4', { message: 'validation.GENERAL.IS_UUID' })
  @IsNotEmpty({ message: 'validation.GENERAL.NOT_EMPTY' })
  artistId!: string;

  @IsString({ message: 'validation.GENERAL.IS_STRING' })
  @IsNotEmpty({ message: 'validation.GENERAL.NOT_EMPTY' })
  @MinLength(1, { message: 'validation.GENERAL.MIN_LENGTH' })
  @MaxLength(5000, { message: 'validation.GENERAL.MAX_LENGTH' })
  body!: string;

  @IsEnum(PostVisibility, { message: 'validation.GENERAL.IS_ENUM' })
  visibility!: PostVisibility;

  @IsOptional()
  @IsDateString({}, { message: 'validation.GENERAL.IS_DATE' })
  scheduledAt?: string;

  @IsOptional()
  @IsArray({ message: 'validation.GENERAL.IS_ARRAY' })
  @IsUUID('4', { each: true, message: 'validation.GENERAL.IS_UUID' })
  mediaFileIds?: string[];
}
```

## Pagination DTO

List endpoints MUST extend `PaginationDto` from `@shared/dtos/pagination.dto`:

```ts
import { PaginationDto } from '@shared/dtos/pagination.dto';

export class FindPostDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'validation.GENERAL.IS_STRING' })
  artistSlug?: string;
}
```

The base class already provides `page`, `limit`, `buildPagination()` and `buildMeta(total)` — do not reinvent these.

## Query-string arrays

When accepting a comma-separated list, decode it with `@Transform` **before** the validators run:

```ts
@Transform(({ value }) =>
  typeof value === 'string' ? value.split(',') : value,
)
@IsOptional()
@IsArray({ message: 'validation.GENERAL.IS_ARRAY' })
@IsEnum(FileType, { each: true, message: 'validation.GENERAL.IS_ENUM' })
fileType?: FileType[];
```

## Available i18n keys

See `apps/<service>/src/i18n/{en,es}/validation.json`. The common bucket is:

```
validation.GENERAL.NOT_EMPTY
validation.GENERAL.IS_STRING
validation.GENERAL.IS_EMAIL
validation.GENERAL.IS_UUID
validation.GENERAL.IS_DEFINED
validation.GENERAL.IS_ARRAY
validation.GENERAL.ARRAY_MIN_SIZE
validation.GENERAL.MIN_LENGTH
validation.GENERAL.MAX_LENGTH
validation.GENERAL.IS_ENUM
validation.GENERAL.IS_BOOLEAN
validation.GENERAL.IS_DATE
validation.CUSTOM.PHONE_FORMAT
validation.CUSTOM.PASSWORD_FORMAT
```

If you need a key that doesn't exist, add it to both `en/validation.json` and `es/validation.json`, under the existing `GENERAL` / `CUSTOM` buckets when possible.

## Rules

1. Every inbound parameter goes through a DTO. **Never** `@Body('field')`, `@Query('field')`, or untyped `@Param()`.
2. Every validator carries a `message:` in the `validation.*` namespace.
3. Use definite-assignment (`!:`) on required fields; prefer `?:` only with `@IsOptional()`.
4. Put DTOs under `apps/<service>/src/dto/` (one file per DTO).
5. Re-export enums from `generated/prisma/client` rather than duplicating them.

## Anti-patterns

```ts
// ❌ Field-level extraction — skips the pipe entirely
@Post('login')
login(
  @Body('email') email: string,
  @Body('password') password: string,
) {}

// ❌ Missing message key — response leaks English default
@IsString()
name!: string;

// ❌ Reinventing pagination
@IsOptional() limit?: number;
@IsOptional() page?: number;
```
