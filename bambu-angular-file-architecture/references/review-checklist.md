# Checklist de revisión de arquitectura

Cada punto trae el `grep` que lo detecta. Corre todos, **reporta antes de mover nada**: mover un
archivo entre capas cambia qué entra al chunk inicial, y eso se revisa con un build, no de palabra.

Ajusta `SRC=src/app`, el prefijo `<px>` y el nombre del dominio a cada proyecto.

## 1. `shared/` contaminado con negocio

```bash
grep -rn "from '.*\(core/<dominio>\|features/\)" $SRC/shared/
```

Cualquier resultado es una violación. El componente no es del design system: muévelo a
`features/<área>/ui/`, o extrae el pedazo genérico y deja el negocio afuera.

```bash
grep -rln "inject(" $SRC/shared/ui/
```

Un primitivo que inyecta algo (más allá de utilidades sin estado) probablemente ya tiene estado de
negocio. Revisa qué inyecta.

## 2. `core/` dependiendo de pantallas

```bash
grep -rn "from '.*features/" $SRC/core/
```

Cero resultados esperados. `core/` no sabe que existen pantallas.

## 3. Reglas de negocio acopladas a Angular

```bash
grep -n "@angular" $SRC/core/*/*.rules.ts
```

Las reglas son funciones puras. Si necesitan algo del framework, lo que necesitan en realidad es
recibirlo como parámetro.

```bash
grep -rn "catalog\|CATALOG\|LIMITS" $SRC/core/*/*.rules.ts | grep -v "catalogs[:,)]"
```

Busca catálogos leídos de constantes internas en vez de recibidos por parámetro.

## 4. Lógica de negocio dentro de componentes

```bash
grep -rn "computed(" $SRC/features/ | wc -l
```

No es un error en sí; el olor es un `computed()` largo con condiciones del negocio en vez de una
llamada a `*.rules.ts`. Revisa a mano los que pasen de ~5 líneas: si la condición tiene nombre en el
documento de negocio, es una regla y va en `core/<dominio>/`.

## 5. El mock inyectado directo

```bash
grep -rn "Mock.*Repository" $SRC --include=*.ts | grep -v "core/<dominio>/\|app.config.ts"
```

Solo `app.config.ts` (el `provide`) y el propio archivo del mock deben nombrarlo. Lo demás inyecta el
`InjectionToken`.

## 6. Barrels de más

```bash
find $SRC -name index.ts
```

Debe devolver exactamente uno: `shared/ui/index.ts`.

## 7. Imports estáticos de páginas (lazy roto)

```bash
grep -rn "^import .*pages/" $SRC/app.routes.ts $SRC/features/*/*.routes.ts
```

En un archivo de rutas, las páginas solo entran por `import()` dinámico. Después confirma con el
build que siguen todos los chunks esperados.

## 8. Guards repetidos en hijos

```bash
grep -rn "canActivate" $SRC/features/
```

Un `canActivate` por área (en el padre). Varios del mismo guard en hijos de la misma rama es
duplicación.

## 9. Nombres de archivo

```bash
find $SRC/features $SRC/layouts -name "*.component.ts" -o -name "*.page.ts"
```

Cero resultados: las páginas y componentes no llevan sufijo de tipo. Y al revés, lo que sí lo lleva:

```bash
ls $SRC/core/*/ | grep -vE "\.(guard|interceptor|service|repository|rules|model|strategy|routes|spec)\.ts$|/$|^$"
```

## 10. Carpetas de convención vacías sin marcar

```bash
find $SRC -type d -empty
```

Deben tener `.gitkeep` (si la carpeta es parte del esqueleto) o borrarse (si nunca se va a usar).

## 11. Estilos de terceros dentro de componentes

```bash
grep -rn "::ng-deep\|:host ::" $SRC --include=*.ts --include=*.css
```

Los overrides de librerías van en `src/styles/<librería>.css`. `::ng-deep` está deprecado y además
no alcanza a overlays y portales renderizados fuera del componente.

## Qué reportar

Por hallazgo: archivo y línea, qué regla rompe, y el movimiento propuesto. Agrupa por capa. Si hay
más de unos pocos hallazgos en `shared/`, el problema no son los archivos sueltos sino que la regla
de pertenencia nunca se aplicó — propón el refactor completo de esa capa, no diez movimientos.
