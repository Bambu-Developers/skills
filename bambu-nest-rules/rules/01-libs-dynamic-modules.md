# 01 — Libs must expose dynamic modules

Every library under `libs/<name>/` that wraps an external client (AWS SDK, Stripe, Firebase, Redis, Prisma…) MUST be configurable via `forRoot(options)` and `forRootAsync(options)`. Static `@Module({ providers: [X], exports: [X] })` is only acceptable when the service has **no configuration at all** (rare — `CognitoModule` is the main exception, and even that relies on env vars read by the service itself).

## Why

- Apps must be able to inject different regions/credentials per service and per environment.
- Secret-backed configuration is loaded asynchronously via `forRootAsync` + `SecretsManagerService` (see rule 02).
- Static `.env` reads inside a library couple the lib to a global, block tests, and defeat DI.

## Required shape

Each lib owns three files inside `libs/<name>/src/`:

```
constants/<name>.constants.ts          // export const X_MODULE_OPTIONS = Symbol('...')
interfaces/<name>-module-options.interface.ts
<name>.module.ts
<name>.service.ts
index.ts                               // re-export Module + Service + public interfaces
```

### Constants

```ts
// libs/<name>/src/constants/<name>.constants.ts
export const EXAMPLE_MODULE_OPTIONS = 'EXAMPLE_MODULE_OPTIONS';
```

### Interfaces

```ts
// libs/<name>/src/interfaces/example-module-options.interface.ts
import { ModuleMetadata } from '@nestjs/common';

export interface ExampleModuleOptions {
  region: string;
  // other statically-known options
}

export interface ExampleModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<ExampleModuleOptions> | ExampleModuleOptions;
  inject?: any[];
}
```

### Module (canonical template)

```ts
// libs/<name>/src/example.module.ts
import { DynamicModule, Module } from '@nestjs/common';
import { EXAMPLE_MODULE_OPTIONS } from './constants/example.constants';
import {
  ExampleModuleAsyncOptions,
  ExampleModuleOptions,
} from './interfaces/example-module-options.interface';
import { ExampleService } from './example.service';

@Module({})
export class ExampleModule {
  static forRoot(options: ExampleModuleOptions): DynamicModule {
    return {
      module: ExampleModule,
      providers: [
        { provide: EXAMPLE_MODULE_OPTIONS, useValue: options },
        ExampleService,
      ],
      exports: [ExampleService],
    };
  }

  static forRootAsync(options: ExampleModuleAsyncOptions): DynamicModule {
    return {
      module: ExampleModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: EXAMPLE_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        ExampleService,
      ],
      exports: [ExampleService],
    };
  }
}
```

### Service

```ts
// libs/<name>/src/example.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EXAMPLE_MODULE_OPTIONS } from './constants/example.constants';
import { ExampleModuleOptions } from './interfaces/example-module-options.interface';

@Injectable()
export class ExampleService {
  private readonly logger = new Logger(ExampleService.name);

  constructor(
    @Inject(EXAMPLE_MODULE_OPTIONS)
    private readonly options: ExampleModuleOptions,
  ) {}
}
```

## Reference implementations inside the repo

- `libs/prisma/src/prisma.module.ts` — `global: true` + `forRoot` + `forRootAsync`
- `libs/secrets-manager/src/secrets-manager.module.ts` — minimal `{ region }` options
- `libs/s3/src/s3.module.ts` — `{ region, bucketName }` options
- `libs/stripe/` — pulls keys from Secrets Manager via `forRootAsync`
- `libs/media-live/`, `libs/cloudfront/`, `libs/drm/` — multi-option async setup

## Anti-patterns

```ts
// ❌ Do NOT read process.env inside the library
@Injectable()
export class S3Service {
  private client = new S3Client({ region: process.env.AWS_S3_REGION }); // ❌
}

// ❌ Do NOT export the service without a dynamic module when it takes config
@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {} // ❌ service can't be configured per-app

// ❌ Do NOT inline new XClient() in the constructor body with hard-coded values
```

## Checklist when creating a new lib

- [ ] `constants/*.constants.ts` exports the `MODULE_OPTIONS` token.
- [ ] `interfaces/*-module-options.interface.ts` declares sync + async option shapes.
- [ ] Module has `forRoot` and `forRootAsync` static methods.
- [ ] Service injects options via `@Inject(X_MODULE_OPTIONS)`.
- [ ] `index.ts` re-exports `Module`, `Service`, and public interfaces.
- [ ] No reference to `process.env` or `@config/env.config` anywhere inside the lib.
