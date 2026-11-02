# bambu-angular-file-architecture

Skill de Claude Code para definir y mantener la **arquitectura de archivos** de una app Angular
standalone (v17+, ideal v20+). Destila una estructura por capas a reglas agnósticas al dominio y al
design system, para arrancar proyectos nuevos con la misma forma y para mantener en su sitio los que
ya existen. La premisa: **dónde vive un archivo es una decisión de diseño, no de gusto**.

Cuatro capas con una regla de pertenencia verificable cada una — `core/` (infraestructura singleton y
módulo de dominio), `shared/ui/` (design system sin estado de negocio), `layouts/` (contenedores de
ruta) y `features/` (pantallas y rutas) — más lazy loading por área, repositorio como interfaz +
`InjectionToken` con una sola implementación que conoce el backend, y reglas de negocio como
funciones puras fuera de Angular.

## Estructura (auto-contenida)

```
bambu-angular-file-architecture/
├── SKILL.md                          # el árbol, las 4 reglas de pertenencia, dependencias, nombres, casos frontera
├── references/
│   ├── domain-module.md              # model / rules puras / repository + InjectionToken / mock único, con esqueletos
│   ├── routing.md                    # un *.routes.ts por área, lazy siempre, guards en el padre, verificación por chunks
│   └── review-checklist.md           # once comprobaciones, cada una con el grep que la detecta
└── scripts/
    └── scaffold-architecture.sh      # crea el esqueleto en un proyecto nuevo (idempotente, nunca sobrescribe)
```

## Instalación

```bash
npx skills add Bambu-Developers/skills/bambu-angular-file-architecture
```

O copiando la carpeta directamente:

```bash
# A nivel usuario (sirve para todos tus proyectos)
cp -R bambu-angular-file-architecture ~/.claude/skills/

# …o a nivel proyecto
cp -R bambu-angular-file-architecture <tu-proyecto>/.claude/skills/
```

## Uso

En conversación se activa sola por su `description`: "¿dónde va este archivo?", "organiza el
proyecto con esta arquitectura", "revisa la estructura", "misma estructura que el otro proyecto",
"estructura de carpetas", "arquitectura por capas".

Para un proyecto nuevo, desde su raíz:

```bash
~/.claude/skills/bambu-angular-file-architecture/scripts/scaffold-architecture.sh \
  --prefix bam --domain order --areas auth,dashboard --dry-run
```

Crea el árbol con `.gitkeep`, el único barrel (`shared/ui/index.ts`) y los archivos del módulo de
dominio en blanco. Quita `--dry-run` para escribirlo.

## Lo que la skill decide (y lo que no)

Decide **ubicación**: qué capa, qué carpeta, qué nombre de archivo, qué puede importar qué. No decide
diseño visual, ni testing E2E (para eso está [`bambu-playwright-qa-e2e`](../bambu-playwright-qa-e2e)),
ni convenciones de sintaxis de Angular más allá de las que determinan dónde vive un archivo.

## Portarla a otro proyecto

Es agnóstica al dominio: lo único que cambia por proyecto es el prefijo del design system, el nombre
del dominio y las áreas de `features/` — todo parametrizado, nada hardcodeado. Después de hacer
scaffolding, documenta en el `CLAUDE.md` del proyecto solo las **decisiones propias** (el dominio,
las áreas, el prefijo, los chunks esperados), no la arquitectura genérica: para eso está esta skill.
