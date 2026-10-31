# El módulo de dominio (`core/<dominio>/`)

Esqueleto completo del patrón. `<dominio>` es el sustantivo del negocio en singular y kebab-case
(`order`, `invoice`, `expense-report`); los nombres de abajo son plantillas, no literales.

## 1. `<dominio>.model.ts` — solo tipos

```ts
export type OrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Order {
  readonly id: string;
  readonly status: OrderStatus;
  readonly items: readonly OrderItem[];
  // …
}

/** Lo que en producción vendrá de una tabla de configuración. */
export interface OrderCatalogs {
  readonly limitsByCategory: Readonly<Record<string, number>>;
}
```

Sin funciones, sin clases, sin imports de Angular. `readonly` por default: los modelos del dominio se
reemplazan, no se mutan.

## 2. `<dominio>.rules.ts` — funciones puras

```ts
import type { Order, OrderCatalogs, OrderItem } from './order.model';

/** RN-03 — una partida excede cuando supera el límite de su categoría. */
export function isOverLimit(item: OrderItem, catalogs: OrderCatalogs): boolean {
  const limit = catalogs.limitsByCategory[item.category];
  return limit !== undefined && item.amount > limit;
}

/** RN-07 — un borrador es enviable si no tiene partidas inválidas. */
export function canSubmit(order: Order, catalogs: OrderCatalogs): boolean {
  return order.status === 'DRAFT' && order.items.every((i) => isValidItem(i, catalogs));
}
```

Tres condiciones que no se negocian:

1. **Sin Angular** — nada de `inject()`, `signal()`, decoradores ni tipos del framework. Estas
   funciones deben poder correr en un test de Node sin TestBed.
2. **El catálogo entra como parámetro.** En cuanto una regla lee una constante interna o inyecta un
   servicio, reemplazar el mock por el catálogo real obliga a tocar la regla.
3. **Un nombre por regla de negocio**, numerada si hay documento. Las pantallas componen estas
   funciones; no reimplementan la condición en un `computed()`.

`<dominio>.rules.spec.ts` es la suite de más valor por línea del proyecto: entradas y salidas puras,
sin render.

## 3. `<dominio>.repository.ts` — el contrato

```ts
import { InjectionToken } from '@angular/core';
import type { Order, OrderStatus } from './order.model';

export interface OrderFilters {
  readonly status?: OrderStatus;
  readonly text?: string;
}

export interface CreateDraftInput {
  readonly requesterId: string;
  // …
}

export interface OrderRepository {
  list(filters: OrderFilters): Promise<readonly Order[]>;
  getById(id: string): Promise<Order | null>;
  createDraft(input: CreateDraftInput): Promise<Order>;
  save(id: string, input: SaveDraftInput): Promise<Order>;
}

export const ORDER_REPOSITORY = new InjectionToken<OrderRepository>('OrderRepository');
```

Los DTOs de entrada viven aquí, no en el modelo: son parte del contrato de escritura, no del dominio.

## 4. `mock-<dominio>.repository.ts` — la única implementación

En memoria, sembrada con datos de ejemplo, con la latencia simulada de un backend real (un `await`
de unos cientos de ms) para que los estados de carga se diseñen desde el principio y no aparezcan
como bug el día de la integración.

Se registra una sola vez, en `app.config.ts`:

```ts
{ provide: ORDER_REPOSITORY, useClass: MockOrderRepository }
```

**Es el único archivo del proyecto que el día del backend real cambia de implementación.** Si alguna
pantalla importa `MockOrderRepository` directamente, esa garantía se perdió: inyecta siempre el token.

## 5. Consumo desde una pantalla

```ts
private readonly repo = inject(ORDER_REPOSITORY);

protected readonly order = resource({
  params: () => this.id(),                       // input() de la ruta
  loader: ({ params }) => this.repo.getById(params),
});
```

`resource()` de `@angular/core` expone `.value()` / `.isLoading()` / `.error()` / `.reload()`: los
cuatro estados que la pantalla tiene que renderizar, sin suscripciones a mano. Las reglas se aplican
en `computed()` sobre `order.value()`, llamando a las funciones puras de `*.rules.ts`.

## Cuándo hay más de un dominio

Una carpeta por dominio bajo `core/`, cada una con su propio juego de los cinco archivos. No crear
un `core/domain/` que los agrupe: el nivel extra no agrega información y alarga todos los imports.
Si dos dominios comparten tipos, el compartido baja a `core/models/`.
