# bambu-spec-define

Skill de Claude Code para la mitad **lenta** de un flujo de spec-driven design:
crea y mantiene specs (`SPEC NN`) como el contrato escrito que precede al código,
con preguntas socráticas sección por sección y un ciclo de vida de estados que
bloquea el paso a Approved mientras algo siga ambiguo. Forma pareja con
[**bambu-spec-implement**](../bambu-spec-implement), que ejecuta rápido una vez
que el spec correspondiente está Approved.

> "A spec is not decorative documentation. It is the contract that drives later
> execution. If the spec is vague, the code will improvise."

## Estructura (auto-contenida)

```
bambu-spec-define/
├── SKILL.md                      # metadata + flujo de trabajo + ciclo de vida de estados
├── templates/
│   ├── SPEC.template.md          # esqueleto del spec con {{placeholders}}
│   ├── section-recipes.md        # receta socrática por sección (qué preguntar, cuándo omitir)
│   ├── STATE.template.md         # esqueleto del tablero de estado de todos los specs
│   └── state-recipes.md          # cómo se renderiza cada bloque del tablero
└── scripts/
    └── state-check.sh            # verifica que el tablero coincida con los archivos (solo lectura)
```

## Instalación

```bash
# A nivel usuario (sirve para todos tus proyectos)
cp -R bambu-spec-define ~/.claude/skills/

# …o a nivel proyecto
cp -R bambu-spec-define <tu-proyecto>/.claude/skills/
```

O instálalo junto con el resto de la colección:

```bash
npx skills add Bambu-Developers/skills/bambu-spec-define
```

Reinicia Claude Code y confírmalo escribiendo `/bambu-spec-define` (debe aparecer
en el autocompletado).

## Uso

Dentro del repositorio donde quieras el spec:

```text
/bambu-spec-define reintento de pagos
```

o en lenguaje natural, por ejemplo:

- *"Escribamos el spec del reintento de pagos."*
- *"Necesito un spec para el login con PIN de taquilla."*
- *"Manda el SPEC 04 a revisión."*
- *"Apruebo el SPEC 04."*
- *"¿Qué dice el SPEC 02?"*
- *"El SPEC 07 quedó obsoleto, lo reemplazó el SPEC 11."*
- *"¿Cómo vamos con los specs?"*, *"¿qué puedo implementar ya?"*, *"¿qué está bloqueando al SPEC 07?"*

La skill ubica (o crea) el directorio `specs/` en la raíz del repo —o usa
`docs/specs/` si ya existe—, asigna el siguiente número `NN` libre, exige que el
**Objective** quepa en una sola oración, y guía sección por sección con las
preguntas de `templates/section-recipes.md` hasta llenar cada sección obligatoria
o justificar por qué una opcional se omite.

### Ciclo de vida de estados

```
Draft → In review → Approved → Implemented
  ↑___________________|   (editar contenido sustantivo regresa a In review)
  → Obsolete            (desde cualquier estado excepto Implemented)
```

| Estado | Español | Significado |
|---|---|---|
| Draft | Borrador | En construcción, puede estar incompleto. |
| In review | En revisión | Todas las secciones obligatorias están llenas; puede seguir teniendo Open Questions. |
| Approved | Aprobado | Open Questions vacía, Acceptance Criteria no vacío, dependencias también Approved/Implemented. Lo dispara solo una instrucción explícita del usuario. |
| Implemented | Implementado | Lo marca `bambu-spec-implement` al terminar; nunca se vuelve a editar en el lugar. |
| Obsolete | Obsoleto | Cancelado o reemplazado. El archivo nunca se borra. |

### El tablero `STATE.md`

Un spec dice *qué* se va a construir; el tablero dice **cómo vamos**. Vive en
`<specs-dir>/STATE.md` y se regenera al crear un spec, en cada cambio de estado
y cuando lo pidas. Tiene dos mitades, separadas por marcadores:

| Mitad | Qué contiene | Al regenerar |
|---|---|---|
| Generada | Tabla de estatus, resumen, **listos para implementar**, **bloqueados** (con el nombre de quien bloquea), ruta crítica y grafo de dependencias (ASCII siempre; Mermaid solo si el grafo lo amerita) | Se reconstruye entera desde los archivos de spec |
| Narrativa | `## Reading the board` y el apéndice opcional `## Project notes` | Se conserva **verbatim** |

*Listos para implementar* es exactamente la precondición que revalida
`bambu-spec-implement`: Status `Approved` y todas sus dependencias
`Approved`/`Implemented`.

Como el tablero es una foto y las fotos se desactualizan solas, trae su propia
verificación — solo lectura, sale 1 ante cualquier deriva:

```bash
bambu-spec-define/scripts/state-check.sh --dir specs
```

Compara cada fila contra el `> **Status:**` real de su archivo y detecta specs sin
fila, filas sin archivo y dependencias rotas o apuntando a specs obsoletos. Si una
fila y su archivo se contradicen, **gana el archivo**.

### Salida

```text
specs/
├── STATE.md                        # tablero: índice, grafo y qué está listo/bloqueado
└── SPEC-04-reintento-de-pagos.md   # Status: Draft → ... → Approved
```

## Límites (explícitos)

- No escribe ni modifica código de aplicación — eso lo hace `bambu-spec-implement`, y solo cuando el spec está Approved.
- No se auto-aprueba a sí misma — Approved requiere instrucción explícita del usuario nombrando el spec.
- No borra archivos de spec — los marca Obsolete con la razón en la línea de Status.
- No rellena secciones opcionales con relleno genérico — las omite por completo cuando su regla de omisión aplica.
- No parchea filas sueltas del tablero ni pisa su mitad narrativa — regenera el bloque generado completo y conserva la prosa.

Licencia: MIT · Bambu Tech Services.
