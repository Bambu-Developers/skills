# 09 — Thin controllers

Controllers are the HTTP adapter, nothing else. They declare the route, the guards, the status code, and hand the DTO + authenticated user to the service. No branching, no translation, no Prisma calls, no response shaping.

## What belongs in a controller

- `@Controller(...)` route prefix.
- One method per endpoint.
- Method decorators: `@Get/@Post/@Patch/@Delete`, optional `@HttpCode`, `@UseGuards`, `@CheckAbilities`.
- Param decorators: `@Body()`, `@Query()`, `@Param()` — always with a DTO class (rule 04).
- `@GetUser()` to pull the authenticated user (or `@GetUser() user?: AuthUser` with `JwtOptionalGuard`).
- A single `return this.service.method(...)`.

## Canonical controller

```ts
// apps/posts/src/posts.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  GetUser,
  JwtGuard,
  JwtOptionalGuard,
} from '@shared/modules/auth';
import { AuthUser } from '@shared/modules/auth/types/auth.type';
import { AbilitiesGuard } from '@shared/modules/auth/guards/abilities.guard';
import { CheckAbilities } from '@shared/modules/auth/decorators/check-abilities.decorator';
import { Action } from '@shared/modules/auth/casl/casl-ability.factory';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create')
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ action: Action.Create, subject: 'Post' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePostDto, @GetUser() user: AuthUser) {
    return this.postsService.create(dto, user);
  }

  @Get('find')
  @UseGuards(JwtOptionalGuard)
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindPostDto, @GetUser() user?: AuthUser) {
    return this.postsService.findAll(query, user);
  }
}
```

## Rules

1. **One line per method body** whenever possible: `return this.service.method(args)`.
2. **No business logic** — no `if` on request fields, no combining responses, no Prisma calls.
3. **Guards compose access control**: `JwtGuard` (auth required), `JwtOptionalGuard` (user may be anonymous), `AbilitiesGuard` with `@CheckAbilities({ action, subject })` for CASL checks.
4. **Use `@HttpCode(HttpStatus.CREATED | HttpStatus.OK)`** explicitly. Default NestJS 201-for-POST / 200-for-others is acceptable, but being explicit matches the existing convention.
5. **Return the service result directly.** Do not wrap it (`{ data: result }`) unless the service did not do so itself; for paginated lists the service returns `{ data, meta }` (see rule 04).
6. **Do not inject `I18nService` into the controller.** Translation happens in the service (rule 06) or the validation pipe (rule 05).
7. **Do not inject `PrismaService` into the controller.** If a controller needs it, the logic belongs in a service.
8. **Do not catch exceptions in the controller.** Global exception filters + `I18nValidationExceptionFilter` handle formatting.

## Param extraction

```ts
@Param() params: IdParamDto       // ✅ for compound param objects (recommended)
@Param('id') id: string           // ✅ acceptable when it's a single primitive and no validation is needed
@Body() dto: CreatePostDto        // ✅
@Query() query: FindPostsDto      // ✅
@Body('email') email: string      // ❌ skips the pipe
```

When you need validation on a path param, prefer an `IdParamDto` with `@IsUUID` over a bare `@Param('id')` string.

## Anti-patterns

```ts
// ❌ Logic in controller
@Post()
async create(@Body() dto: CreatePostDto, @GetUser() user: AuthUser) {
  if (user.role !== 'ARTIST') throw new ForbiddenException();    // ❌
  dto.artistId = user.artist.id;                                 // ❌
  const post = await this.prisma.post.create({ data: dto });     // ❌
  return { data: post };                                         // ❌
}

// ❌ Translating in controller
@Get(':id')
async findOne(@Param('id') id: string) {
  const post = await this.service.findOne(id);
  if (!post) throw new NotFoundException(
    this.i18n.t('errors.GENERAL.NOT_FOUND'),                     // ❌ belongs in service
  );
  return post;
}
```

## Reference

- `apps/posts/src/posts.controller.ts`
- `apps/files/src/files.controller.ts`
- `apps/auth/src/auth.controller.ts`
