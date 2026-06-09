# 08 — Dependency injection

All collaborators — `PrismaService`, `I18nService`, AWS SDK wrappers, transform helpers — are supplied through constructor injection. Module-level providers are the only place where a provider token is declared.

## Rules

1. **Constructor injection only.** Use `private readonly` fields and a NestJS `@Injectable()` class. No property injection, no manual `new ServiceFoo(...)` inside services or controllers.
2. **Use the module's exported class as the token** for app services. Use the `X_MODULE_OPTIONS` symbol/string for lib options (see rule 01).
3. **Never rely on service-locator patterns.** Do not inject `ModuleRef` and `get()` a provider at runtime unless there is a dynamic-lookup requirement the framework cannot solve (extremely rare in this repo — none today).
4. **One concern per `@Injectable()`.** If a service starts needing more than ~5 injected collaborators, split it or extract a sub-module.
5. **Feature sub-modules import what they need.** Root modules compose app-wide providers (Prisma, I18n, Auth, Cache) and feature modules import only their own services + collaborators.
6. **Avoid `forwardRef(...)`.** Circular imports indicate the two modules should share a third, smaller module.
7. **Shared helpers live under `shared/modules/`** — e.g. `TransformFilesModule`, `AuthPassportModule`, `NotificationModule`, `EmailNotificationModule`, `SocketChatModule`, `MediaDrmModule`. Import the module, do not copy the helper.
8. **Lib services MUST NOT depend on app services.** Libraries under `libs/` can depend on their own options token and other libs; they never import from `apps/` or `shared/`.

## Injection pattern

```ts
@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly transformFilesService: TransformFilesService,
  ) {}
}
```

## Custom tokens (for option bundles inside libs)

```ts
// libs/<name>/src/constants/<name>.constants.ts
export const EXAMPLE_MODULE_OPTIONS = 'EXAMPLE_MODULE_OPTIONS';
```

```ts
// libs/<name>/src/<name>.service.ts
@Injectable()
export class ExampleService {
  constructor(
    @Inject(EXAMPLE_MODULE_OPTIONS)
    private readonly options: ExampleModuleOptions,
  ) {}
}
```

## Scope

Default scope (`Scope.DEFAULT`, singleton) is correct for every service in this repo. Do not change scope unless you know why — request-scoped providers break the top-level Lambda reuse model.

## Anti-patterns

```ts
// ❌ Manual instantiation
const svc = new StripeService({ apiKey: '...' });

// ❌ Reading env inside a service
@Injectable()
class FooService {
  private bucket = process.env.S3_BUCKET_NAME;
}

// ❌ Circular dependency with forwardRef
@Module({
  imports: [forwardRef(() => BarModule)],
})
export class FooModule {}

// ❌ ModuleRef as service locator
@Injectable()
class FooService {
  constructor(private moduleRef: ModuleRef) {}
  async get() {
    return this.moduleRef.get('BarService', { strict: false });
  }
}
```

## Reference

- `apps/posts/src/posts.service.ts` — three clean collaborators via constructor
- `libs/secrets-manager/src/secrets-manager.service.ts` — `@Inject(SECRETS_MANAGER_MODULE_OPTIONS)`
