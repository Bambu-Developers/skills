# Rutas, guards y chunks

## Un archivo de rutas por área

```
app.routes.ts                              raíz
features/<área>/<área>.routes.ts           por área
features/<área>/<sub-área>/<sub-área>.routes.ts   si el área se parte por rol o sección
```

Cada uno exporta una constante nombrada (`export const orderRoutes: Routes = [...]`), no un default:
el import dinámico se lee mejor y el símbolo es grepeable.

## Siempre lazy

```ts
{ path: 'orders', loadChildren: () => import('./features/orders/orders.routes').then(m => m.orderRoutes) }
{ path: 'new',    loadComponent: () => import('./pages/order-form/order-form').then(m => m.OrderForm) }
```

Sin `component:` directo salvo para el `layout` del nivel (que ya está en el chunk del padre) y sin
imports estáticos de páginas desde el archivo de rutas raíz: cada import estático de una página la
mete al chunk inicial y anula el lazy loading sin que nada falle.

## Guards en el padre

```ts
{
  path: 'management',
  canActivate: [roleGuard(['ADMIN'])],
  loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
}
```

El guard protege el área completa una vez. Repetirlo en cada hijo no agrega seguridad (el padre ya
decidió) y multiplica los lugares que hay que actualizar cuando cambia el criterio.

Los guards son funciones (`CanActivateFn`), viven en `core/auth/guards/` y se parametrizan con una
factory (`roleGuard(['ADMIN'])`) en vez de leer configuración global.

## Títulos

`title` en la ruta, no en el componente. Si el título depende de la navegación, una función
`(route: ActivatedRouteSnapshot) => string` en el mismo archivo de rutas. El cómo se escribe al
documento lo decide una `TitleStrategy` en `core/layout/`.

## Parámetros de ruta

Con `withComponentInputBinding()` en `app.config.ts`, un `:id` entra como `input()` en el componente
de la página. No inyectar `ActivatedRoute` para leer params: el `input()` es una señal y encadena
directo con `resource()`.

## Verificación

El build debe seguir mostrando **un chunk por área lazy**. Es la prueba de que la arquitectura sigue
viva:

```bash
<pm> build | grep -E 'routes|chunk'
```

Si un área desapareció de la lista de chunks, alguien la importó estáticamente — búscalo con el
grep de `review-checklist.md`. Vale la pena anotar en el `CLAUDE.md` del proyecto los nombres de
chunk esperados, para que la regresión sea evidente.
