# 06 — Services validate and throw with i18n

Business rules are enforced in services, never in controllers. When a service refuses to proceed it throws a NestJS HTTP exception whose message is resolved through `I18nService.t(...)` against a key under `errors.*`.

## Required pattern

```ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PrismaService } from '@app/prisma';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(
        this.i18n.t('errors.GENERAL.NOT_FOUND', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return post;
  }
}
```

## Rules

1. **Inject `I18nService`** in every service that can fail; do not build an ad-hoc wrapper.
2. **Always pass `lang: I18nContext.current()?.lang`** as the second arg to `this.i18n.t(...)`. Without it, the translation falls back to the module default and ignores the caller's header.
3. **Pick the correct HTTP exception**:
   - `BadRequestException` — caller sent semantically invalid data (e.g. fan trying to like without an active fan profile).
   - `NotFoundException` — resource does not exist or is hidden from this caller (prefer this over `ForbiddenException` when leaking existence would help an attacker).
   - `ConflictException` — state already equals the requested mutation (e.g. "already liked").
   - `UnauthorizedException` — auth failed / token rejected.
   - `ForbiddenException` — authenticated but not allowed; usually handled by CASL + `AbilitiesGuard` instead.
4. **Reuse error keys** under `errors.GENERAL.*` for cross-domain messages (`NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`). Domain-specific keys go under their own bucket (`errors.POST.*`, `errors.AUTH.*`).
5. **Success messages** returned as `{ message: this.i18n.t('messages.*', { lang }) }` — use the `messages.*` namespace, not `errors.*`.
6. **Do not `throw new Error(...)`** for expected business failures. Raw `Error`s escape the i18n filter and render as 500s.
7. **Do not translate inside the repository / lib layer** — throwing from a lib should surface a typed error; the consuming service translates it.

## Checking keys exist

Before using a new key, confirm it is present in `apps/<service>/src/i18n/en/errors.json` AND `apps/<service>/src/i18n/es/errors.json`. If not, add it to both files under the matching bucket. Use existing keys like:

```
errors.GENERAL.NOT_FOUND
errors.GENERAL.FORBIDDEN
errors.GENERAL.UNAUTHORIZED
errors.AUTH.INVALID_CREDENTIALS
errors.AUTH.USER_NOT_FOUND
errors.AUTH.EMAIL_ALREADY_IN_USE
errors.POST.ALREADY_LIKED
errors.POST.NOT_LIKED
```

## Anti-patterns

```ts
// ❌ Hard-coded English — not translatable
throw new NotFoundException('Post not found');

// ❌ Forgetting the lang arg — ignores caller's language header
throw new NotFoundException(this.i18n.t('errors.GENERAL.NOT_FOUND'));

// ❌ Raw Error — bypasses HTTP filter
if (!post) throw new Error('not found');

// ❌ Throwing inside the controller — business logic leaks up
@Get(':id')
async find(@Param() params: IdDto) {
  const p = await this.service.findOne(params.id);
  if (!p) throw new NotFoundException(...); // service should have done this
  return p;
}
```

## Reference

- `apps/posts/src/posts.service.ts` — canonical usage in `findOne`, `likePost`, `unlikePost`
- `apps/auth/src/auth.service.ts` — multi-error flows
