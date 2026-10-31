---
name: bambu-angular-file-architecture
description: >
  Define y mantiene la arquitectura de archivos de una app Angular standalone (v17+, ideal v20+):
  cuatro capas — `core/` (infraestructura singleton y dominio), `shared/ui/` (design system sin estado
  de negocio), `layouts/` (contenedores de ruta) y `features/` (pantallas y rutas) — con lazy loading
  por área, repositorio como interfaz + `InjectionToken` con una sola implementación que conoce el
  backend, reglas de negocio como funciones puras fuera de Angular, y UI compartida por área en
  `features/<área>/ui/`. Úsala al **crear un proyecto Angular nuevo** (scaffolding inicial de carpetas),
  al **decidir dónde va un archivo nuevo** ("¿este componente va en shared o en features?", "¿dónde
  pongo este servicio/tipo/regla?", "¿creo una carpeta nueva?"), al **revisar o refactorizar** una
  estructura existente que ya se desordenó (componentes de negocio en `shared/`, lógica de negocio
  dentro de componentes, imports que cruzan capas, barrels que rompen los chunks lazy), o cuando el
  usuario diga "sigue esta arquitectura", "misma estructura que el otro proyecto", "organiza el
  proyecto", "dónde creo este archivo", "estructura de carpetas", "arquitectura por capas". Es
  agnóstica al dominio y al design system: el prefijo de selectores, el nombre del dominio y las áreas
  de `features/` se derivan del proyecto. NO cubre decisiones de UI/diseño visual, testing E2E, ni
  convenciones de sintaxis de Angular más allá de lo que determina dónde vive un archivo.
---

# bambu-angular-file-architecture

Arquitectura de archivos por capas para apps Angular standalone. La premisa es que **la ubicación de
un archivo es una decisión de diseño, no de gusto**: cada capa tiene una regla de pertenencia
verificable, y la dirección de las dependencias entre capas es lo que mantiene los chunks lazy
separados y permite cambiar el backend sin tocar la UI.

## El árbol

```
src/
  main.ts
  styles.css                 punto de entrada de estilos; solo @imports
  styles/
    theme.css                tokens semánticos del design system (fuente de verdad del tema)
    base.css                 resets y estilos de elemento
    <librería>.css           un archivo por librería de terceros que haya que sobrescribir
  app/
    app.ts · app.html · app.config.ts · app.routes.ts

    core/                    infraestructura singleton: existe una sola vez por app
      auth/guards/           *.guard.ts
      auth/services/         *.service.ts
      interceptors/          *.interceptor.ts
      <tema>/                theme, layout, tokens… un servicio singleton por carpeta
      <dominio>/             EL módulo de negocio (ver abajo)
        <dominio>.model.ts         tipos y uniones; sin lógica
        <dominio>.rules.ts         funciones puras; sin Angular, sin UI
        <dominio>.rules.spec.ts
        <dominio>.repository.ts    interfaz + InjectionToken + DTOs de entrada
        mock-<dominio>.repository.ts   única implementación; el único archivo que sabrá del backend
        mock-catalogs.ts / mock-users.ts

    shared/                  reutilizable y SIN estado de negocio
      ui/                    primitivos del design system: <px>-button, <px>-input…
        <nombre>/<px>-<nombre>.ts (+ .html/.spec.ts)
        index.ts             el ÚNICO barrel del proyecto
      directives/ pipes/ utils/

    layouts/                 contenedores de ruta: shell + <router-outlet>
      <nombre>-layout/<nombre>-layout.ts

    features/                pantallas; el único lugar que conoce rutas y estado de pantalla
      <área>/
        <área>.routes.ts     rutas del área, lazy
        pages/<pantalla>/<pantalla>.ts (+ .html/.spec.ts)
        ui/                  UI compartida ENTRE pantallas de esa área (sí puede tener negocio)
```

Las carpetas de convención que todavía están vacías se crean igual, con `.gitkeep`: el esqueleto
comunica dónde va lo que falta.

## Las cuatro reglas de pertenencia

Aplícalas en orden; la primera que dé verdadero decide la capa.

1. **¿Conoce una ruta, o es la pantalla de una?** → `features/<área>/`.
2. **¿Es un shell con `<router-outlet>` que varias rutas comparten?** → `layouts/`.
3. **¿Necesita inyectar estado de negocio (un repositorio, un servicio de dominio, un modelo del
   negocio)?** → **nunca** `shared/`. Si lo usan varias pantallas de la misma área, va en
   `features/<área>/ui/`; si lo usan áreas distintas, es señal de que la lógica debe bajar a
   `core/<dominio>/` y la UI quedarse duplicada o moverse a un área común.
4. **¿Sobrevive sin el negocio — lo podrías copiar a otra app sin arrastrar un solo tipo del
   dominio?** → `shared/ui/` (o `shared/directives|pipes|utils`).

Todo lo demás —singletons, acceso a datos, tipos del dominio, reglas— es `core/`.

> El error más común es el inverso del 3: un componente "se ve genérico" (una tabla, una tarjeta de
> resumen) y se pone en `shared/`, pero importa el modelo del dominio. A partir de ahí `shared/` deja
> de ser portable y cada cambio del negocio lo toca. El criterio no es la apariencia, es qué importa.

### Dirección de las dependencias

```
features ──> shared ──> (nada del proyecto)
   │  └────> core
   └──> layouts ──> shared, core
core/<dominio> ──> (nada de Angular en rules; nada de UI nunca)
```

Prohibido, sin excepción: `shared/` importando de `features/` o de `core/<dominio>/`; `core/`
importando de `features/`; una pantalla importando el **mock** del repositorio en vez de la interfaz.

## El módulo de dominio en `core/<dominio>/`

El patrón que hace que "todavía no hay backend" no se convierta en una reescritura:

- **`*.model.ts`** — tipos, uniones de estatus, catálogos como tipos. Sin funciones.
- **`*.rules.ts`** — las reglas de negocio como **funciones puras**: sin Angular, sin UI, sin leer
  constantes internas. **Los catálogos y la configuración entran como parámetro**, para que
  reemplazar el mock por el catálogo real no toque una sola regla. Numera las reglas (`RN-01…`) si
  existe un documento de negocio, y pruébalas en `*.rules.spec.ts`: es la capa más barata de probar
  y la que más duele equivocar. Antes de escribir una regla nueva, busca si ya hay una función ahí
  para componerla, en vez de reimplementarla dentro de un componente.
- **`*.repository.ts`** — `interface` + `InjectionToken` + los DTOs de entrada. Es el contrato.
- **`mock-*.repository.ts`** — la implementación en memoria, sembrada con datos de ejemplo. **Es el
  único archivo que el día que exista un backend real sabrá que existe**: todo lo demás inyecta el
  token, nunca la clase.

Lectura desde la UI: `resource({ params, loader })` de `@angular/core` (no `HttpClient` suelto ni
suscripciones a mano) — te da `.value()`, `.isLoading()`, `.error()` y `.reload()`, que es
exactamente el conjunto de estados que una pantalla tiene que renderizar.

Ver `references/domain-module.md` para el esqueleto completo.

## Rutas y chunks

Un archivo `*.routes.ts` por área, siempre con `loadChildren` / `loadComponent`. Los guards van en la
ruta **padre** (el área completa), no repetidos pantalla por pantalla. El resultado esperado es que
cada área sea un chunk independiente: **un usuario de un rol nunca descarga el bundle del otro**, y
eso se verifica en el output de `build`, no de palabra.

`withComponentInputBinding()` activo: los parámetros de ruta entran como `input()`, no con
`ActivatedRoute`. Ver `references/routing.md`.

## Nombres de archivo

- `kebab-case.ts` siempre; el archivo se llama como el símbolo que exporta.
- **Sin sufijo de tipo** en componentes y páginas: `login.ts`, `report-list.ts` — no
  `login.component.ts`. Los sufijos se reservan para lo que no es componente y necesita distinguirse:
  `.guard.ts`, `.interceptor.ts`, `.service.ts`, `.repository.ts`, `.rules.ts`, `.model.ts`,
  `.routes.ts`, `.strategy.ts`.
- Los primitivos del design system llevan el prefijo en el nombre del archivo
  (`<px>-button.ts`), las features no (`report-list.ts`). Dos prefijos de selector: uno para el
  design system (`<px>-`), otro para features (`app-`, el de `angular.json`).
- El `.spec.ts` vive **junto** al archivo que prueba. Las suites E2E viven **fuera de `src/`**, que
  es lo que hace que el builder de tests unitarios no las descubra sin tocar `angular.json`.
- Template inline mientras quepa de un vistazo; en cuanto crece o tiene control flow anidado, pasa a
  `.html` hermano con `templateUrl` **relativo al `.ts`**.

## Barrels

**Uno solo: `shared/ui/index.ts`.** Nada más. Un barrel en `core/` o en `features/` acopla el grafo
de imports y arrastra al chunk inicial módulos que debían ser lazy — el síntoma es un chunk que crece
sin que nadie haya agregado una pantalla.

## Cómo usar esta skill

**Proyecto nuevo** — corre `scripts/scaffold-architecture.sh` (ver `--help`: toma prefijo, nombre del
dominio y áreas), que crea el árbol con `.gitkeep`, el barrel de `shared/ui/` y los archivos del
módulo de dominio en blanco. Después, documenta en el `CLAUDE.md` del proyecto las **decisiones
propias** (el dominio, las áreas, el prefijo), no la arquitectura genérica: para eso está esta skill.

**Archivo nuevo en un proyecto existente** — aplica las cuatro reglas de pertenencia en orden, y
antes de crear una carpeta nueva verifica que no exista ya una con ese rol. Si el archivo no encaja
en ninguna capa, el problema casi siempre es que hace dos cosas: pártelo.

**Revisión o refactor** — `references/review-checklist.md` tiene la lista con los `grep` que detectan
cada violación. Úsala completa; reporta hallazgos antes de mover archivos, porque mover un archivo
entre capas cambia qué entra al chunk inicial.

## Casos frontera resueltos

- **Un primitivo del design system que necesita un pipe del dominio** → el pipe se queda en
  `features/<área>/ui/`, el primitivo recibe el texto ya formateado por `input()`. El design system
  no formatea negocio.
- **Dos pantallas de áreas distintas renderizan el mismo bloque** → si el bloque es solo lectura y
  depende del modelo, vive en `features/<área-dueña>/ui/` y la otra área lo importa; si eso se
  repite más de dos veces, el área dueña está mal elegida.
- **Un servicio que solo usa una pantalla** → quédalo en `features/<área>/`, no en `core/`. `core/`
  es para lo que es singleton *por diseño*, no para todo lo que sea servicio.
- **Un tipo que usan `core/` y una pantalla** → es del dominio: `core/<dominio>/*.model.ts`.
- **Estilos de una librería de terceros** → `src/styles/<librería>.css`, nunca dentro del componente
  (los overrides de un overlay/portal no alcanzan al componente que lo abrió).
