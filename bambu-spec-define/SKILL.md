---
name: bambu-spec-define
description: Crea, revisa y gestiona el ciclo de vida de specs (`SPEC NN`) para un feature antes de que se escriba una sola línea de código — la fase deliberadamente lenta de un flujo de spec-driven design. Hace preguntas socráticas para llenar cada sección de `templates/SPEC.template.md` (contexto, goals, non-goals, dependencias, requisitos funcionales, interfaces y contratos, requisitos no funcionales, edge cases, criterios de aceptación, riesgos, preguntas abiertas), asigna el número `NN` secuencial, valida las referencias `Depends on:`, y controla las transiciones de estado Draft → In review → Approved → Implemented → Obsolete (o sus equivalentes en español — Borrador → En revisión → Aprobado → Implementado → Obsoleto). Usa este skill cuando el usuario pida "escribamos el spec de...", "necesito un spec para...", "let's spec out...", "write a spec for...", "manda este spec a revisión", "apruebo el SPEC 04", "approve SPEC 04", "¿qué dice el SPEC 02?", "este spec quedó obsoleto", o mencione `specs/SPEC-NN` explícitamente. Mantiene además el tablero `STATE.md` del directorio de specs —índice de todos los specs con su estado, grafo de dependencias, qué está listo para implementar y qué está bloqueado y por quién—, que se regenera al crear un spec y en cada cambio de estado; úsalo también cuando el usuario pregunte "¿cómo vamos con los specs?", "estado de los specs", "actualiza el STATE", "qué specs faltan", "qué puedo implementar ya", "qué está bloqueando al SPEC 07", "muéstrame el grafo de dependencias de los specs", "spec status board", o mencione `STATE.md`. Nunca escribe código de aplicación ni empieza una implementación — eso es trabajo de **bambu-spec-implement**, que solo arranca una vez que el spec correspondiente llegue a Approved.
---

# Spec-driven design — definición del spec

> "A spec is not decorative documentation. It is the contract that drives later execution. If the spec is vague, the code will improvise. That is why this flow is deliberately slow during the definition phase and fast during the writing phase."

Este skill cubre la mitad **lenta** de ese flujo: producir, revisar y aprobar el contrato escrito antes de que nadie escriba código. La mitad rápida — ejecutar ese contrato — es **bambu-spec-implement**, que se niega a arrancar si el spec no está Approved.

## Cuándo usar este skill

- "Escribamos el spec de...", "necesito un spec para...", "let's spec out...", "write a spec for X".
- "Manda este spec a revisión", "send this spec to review".
- "Apruebo el SPEC 04", "approve SPEC 04".
- "¿Qué dice el SPEC 02?", "muéstrame el SPEC 03".
- "Este spec ya quedó obsoleto, lo reemplazó el SPEC 09".
- El usuario menciona `specs/SPEC-NN` o un número de spec explícito.
- "¿Cómo vamos con los specs?", "actualiza el STATE", "¿qué puedo implementar ya?", "¿qué está bloqueando al SPEC 07?" — todo eso se contesta con el tablero (Paso 7), no abriendo archivo por archivo.

No lo uses para escribir o modificar código de aplicación — ese es el límite duro de este skill. Tampoco lo uses para documentación de referencia general (eso es `bambu-readme-generator` u otros docs); un spec es un contrato de una sola iniciativa, no documentación descriptiva del repo.

## Flujo de trabajo

### Paso 0 — Ubicar el directorio de specs

```bash
test -d docs/specs && echo docs/specs || echo specs
```

Si `docs/specs/` ya existe en el repo, úsalo. Si no, `specs/` en la raíz es el default — detecta, no asumas. Si ninguno existe todavía (primer spec del repo), crea `specs/` en la raíz.

El tablero vive en ese mismo directorio, como `<specs-dir>/STATE.md` — al lado de los specs, para que sus enlaces relativos funcionen igual en GitHub que en el editor.

### Paso 1 — Spec nuevo o continuación

Si el usuario referencia un `SPEC NN` existente (por número, título o archivo), ábrelo y continúa desde ahí — el resto de los pasos aplica igual a "llenar lo que falta" que a "escribir desde cero". Si no hay referencia, es un spec nuevo: sigue al Paso 2.

### Paso 2 — Asignar número y nombre de archivo

Escanea `<specs-dir>/*.md` buscando el `NN` más alto en **todos** los estados, incluyendo Obsolete, y asigna `max + 1`. Los números no se reciclan ni siquiera si el spec llega a Obsolete.

Nombre de archivo: `<specs-dir>/SPEC-NN-slug-del-titulo.md` (kebab-case, derivado del título).

Si detectas que ya existe un archivo con el mismo `NN` (colisión por ramas paralelas que se mergearon por separado), ofrece una operación de renumeración atómica: renombra el archivo más reciente al siguiente número libre, corrige su propio header `# SPEC NN`, y actualiza cualquier línea `Depends on:` de otros specs que apuntara al número viejo.

### Paso 3 — El Objective primero

Antes de tocar cualquier otra sección, escribe el **Objective**: una sola oración, legible en 5 segundos, que describa qué se va a construir. Si no cabe en una oración sin "y" ni ", además", el feature es demasiado grande — detente y propón dividirlo en dos o más specs que se referencien entre sí vía `Depends on:`.

### Paso 4 — Llenar el cuerpo, sección por sección

Usa `templates/SPEC.template.md` como esqueleto y `templates/section-recipes.md` como guía — cada placeholder tiene ahí una receta socrática (preguntas a hacer, no heurísticas de detección de código: el spec normalmente precede al código, así que no hay nada que autodescubrir). Ve sección por sección, en orden, y no avances a la siguiente hasta que la actual sea concreta — presiona contra respuestas vagas de una palabra.

| Sección | Clase | Si no aplica |
|---|---|---|
| Context | MANDATORY | — (siempre tiene contenido real) |
| Goals | MANDATORY | — |
| Non-goals | MANDATORY | — (una lista vacía es señal de alerta, no de limpieza) |
| Dependencies | OPTIONAL | Omite la sección entera si `Depends on:` del header está vacío y no hay dependencia externa |
| Functional requirements | MANDATORY | — |
| Interfaces & contracts | MANDATORY | `N/A — <razón>` si de verdad no expone nada |
| Non-functional requirements | OPTIONAL | Omite si no hay ninguna cifra o restricción más allá de lo que el repo ya garantiza |
| Edge cases | MANDATORY | — |
| Acceptance criteria | MANDATORY | — |
| Risks | OPTIONAL | Omite solo si el cambio es trivial y totalmente reversible; dilo explícitamente al omitir |
| Open questions | OPTIONAL | Omite una vez resueltas; mientras no esté vacía, bloquea el paso a Approved |

Una sección MANDATORY sin contenido aplicable se escribe como `N/A — <razón en una línea>`, nunca se deja el encabezado vacío. Una sección OPTIONAL que no aplica se omite por completo (encabezado y placeholder).

### Paso 5 — Validar antes de escribir

- Ninguna sección MANDATORY quedó con `{{...}}` sin sustituir.
- Cada entrada de `Depends on:` resuelve a un archivo de spec que existe.
- Si alguna dependencia está Obsolete, adviértelo explícitamente.
- No hay colisión de número `NN` sin resolver (ver Paso 2).

### Paso 6 — Guardar

Escribe `<specs-dir>/SPEC-NN-slug.md` con `Status: Draft` (o su valor actual si es continuación de un spec existente).

### Paso 7 — Actualizar el tablero `STATE.md`

Un spec contesta "qué vamos a construir". El tablero contesta **"cómo vamos"**: una sola foto, en `<specs-dir>/STATE.md`, con todos los specs, su estado, de qué dependen, cuáles están listos para implementar y cuáles están bloqueados y por quién. Sin él, responder "¿qué sigue?" obliga a abrir archivo por archivo.

Se compone de dos mitades separadas por marcadores, y la frontera es la regla más importante de todo el paso:

- Entre `<!-- spec-state:generated:start -->` y `<!-- spec-state:generated:end -->` va lo **derivable** (tabla, resumen, listos, bloqueados, ruta crítica, grafo). Se regenera **entero** desde los archivos de spec, cada vez. Nunca se parchea una fila a mano.
- Debajo del marcador de cierre va lo **narrativo** (`## Reading the board` y el apéndice opcional `## Project notes`). Se escribe a mano y **se conserva verbatim** en cada regeneración.

Usa `templates/STATE.template.md` como esqueleto y `templates/state-recipes.md` como guía de renderizado: de dónde sale cada dato, cómo se calculan los listos/bloqueados/ruta crítica, y la regla de omisión del diagrama Mermaid (solo con ≥ 6 specs o alguno con 2+ dependencias; por debajo de eso el ASCII ya lo dice todo).

**Cuándo regenerarlo:**

| Disparador | Nota |
|---|---|
| Se creó un spec nuevo (Paso 6) | Siempre, en la misma operación — un spec sin fila es exactamente la deriva que el tablero existe para evitar. |
| Cambió el Status de un spec (Paso 8) | Siempre, incluida la salida a Obsolete: esas filas se quedan, con su razón. |
| Se renumeró un spec por colisión (Paso 2) | El `NN` viejo no debe sobrevivir en ninguna fila ni en el grafo. |
| El usuario pregunta por el estado | "¿Cómo vamos?", "¿qué puedo implementar ya?" — regenera y responde desde el tablero. |
| Hay ≥ 2 specs y todavía no existe tablero | **Ofrécelo**, no lo impongas. Con un solo spec no aporta nada. |

**Cómo:** lee el `STATE.md` actual y guarda todo lo que está después del marcador de cierre → re-deriva el bloque generado completo desde los archivos → escribe el archivo (encabezado + bloque nuevo + narrativo intacto) → corre la verificación y reporta lo que diga:

```bash
scripts/state-check.sh            # o --dir <specs-dir> si no es el default
```

El script compara cada fila contra el `> **Status:**` real de su archivo y detecta specs sin fila, filas sin archivo y dependencias rotas. Es solo lectura: si sale 1, el que está mal es el tablero, nunca el spec.

Si el repo ya tiene un `STATE.md` escrito a mano **sin marcadores**, no adivines dónde estaba la frontera: muéstrale al usuario el bloque generado que escribirías, pregúntale qué prosa existente va bajo `## Reading the board`, y solo entonces reemplaza el archivo.

### Paso 8 — Transiciones de estado

Los estados válidos son **Draft, In review, Approved, Implemented, Obsolete** (o sus equivalentes en español: Borrador, En revisión, Aprobado, Implementado, Obsoleto — acéptalos como entrada del usuario, pero **normaliza siempre al token canónico en inglés al escribir el archivo**, para que `bambu-spec-implement` pueda parsear el Status sin importar en qué idioma ocurrió la conversación).

| Transición | Dispara con | Antes de aplicarla, verifica |
|---|---|---|
| (nuevo) → Draft | Se empieza un spec nuevo | Nada — un Draft puede estar incompleto, es el estado de trabajo. |
| Draft → In review | Instrucción explícita del usuario ("manda a revisión") | Toda sección MANDATORY está presente y sin placeholders sin sustituir. Open Questions puede seguir teniendo items — la revisión es donde se resuelven. |
| In review → Approved | Instrucción explícita del usuario **nombrando el spec** ("apruebo el SPEC 04") — nunca te auto-apruebes | (a) MANDATORY sigue completo; (b) `## Open questions` está ausente o vacía; (c) `## Acceptance criteria` es un checklist no vacío; (d) cada spec en `Depends on:` está, a su vez, Approved o Implemented (nunca Draft/In review/Obsolete). Si algo falla, niégate a cambiar el Status y reporta cuál condición no se cumple. |
| Approved → Implemented | Lo dispara **bambu-spec-implement** al terminar, no este skill por iniciativa propia | Agrega una referencia de una línea (PR o commit) junto al cambio de Status. Es la única escritura permitida sobre un spec ya Approved. |
| cualquiera (menos Implemented) → Obsolete | Instrucción explícita del usuario — feature cancelado, reemplazado, o enfoque abandonado | Anota la razón en la misma línea de Status (`> **Status:** Obsolete — superseded by SPEC 09`). **Nunca borres el archivo** — otros specs pueden referenciarlo en su `Depends on:`. |
| Approved → vuelve a In review | Se edita el contenido sustantivo de un spec ya Approved | Regresa el Status automáticamente a `In review` en cuanto cambia una sección MANDATORY/OPTIONAL — una aprobación no sobrevive a un cambio de contrato. |
| Implemented → (nunca se edita en el lugar) | Se descubre un hueco después de implementado | No toques las secciones sustantivas de un spec Implemented. Si hace falta algo, es un spec **nuevo** que depende de o reemplaza al anterior — la historia de lo que realmente se construyó se mantiene intacta. |

Toda transición de esta tabla termina igual: **regenera el tablero** (Paso 7). Un Status que cambia en el archivo y no en `STATE.md` convierte el tablero en una afirmación falsa, que es peor que no tenerlo.

### Paso 9 — Reporte

Confirma al usuario: ruta del archivo, Status resultante, qué secciones OPTIONAL se omitieron y por qué, si quedan Open Questions pendientes que bloquean el paso a Approved, y el resultado de `state-check.sh` sobre el tablero.

## Reglas duras

- **Nunca** escribas un Objective de dos oraciones — divide el feature en specs separados conectados por `Depends on:`.
- **Nunca** rellenes una sección OPTIONAL con relleno genérico en vez de omitirla cuando su regla de omisión aplica.
- **Nunca** resuelvas en silencio algo que debería ir a Open Questions — eso es exactamente la decisión silenciosa que esta sección existe para evitar.
- **Nunca** muevas un spec a Approved mientras Open Questions no esté vacía, o mientras alguna dependencia en `Depends on:` no esté a su vez Approved/Implemented.
- **Nunca** te auto-apruebes — Approved requiere instrucción explícita del usuario nombrando el spec.
- **Nunca** edites las secciones sustantivas de un spec Implemented — escribe un spec nuevo en su lugar.
- **Nunca** borres un archivo de spec — márcalo Obsolete con la razón en la propia línea de Status.
- **Nunca** escribas código de aplicación — ese es el trabajo de **bambu-spec-implement**, una vez que el spec esté Approved.
- **Nunca** edites a mano el bloque generado del tablero — regenéralo entero desde los archivos de spec. La única excepción permitida es ajena a este skill: al cerrar un handoff, **bambu-spec-implement** actualiza la fila de su spec (Status + Ref) sin recalcular lo demás; esa es justamente la deriva que tu siguiente regeneración reconcilia.
- **Nunca** pises el bloque narrativo del tablero al regenerar — se conserva verbatim; es lo único que la tabla no sabe decir.
- **Nunca** dejes el tablero sin regenerar después de crear un spec o cambiar un Status.
- **Nunca** trates el tablero como fuente de verdad: si una fila y su archivo se contradicen, **gana el archivo** — y el tablero se regenera.

## Files

- `templates/SPEC.template.md` — esqueleto del spec con `{{placeholders}}`, header fijo + 11 secciones de cuerpo.
- `templates/section-recipes.md` — receta socrática por placeholder (qué preguntar, cuándo omitir la sección).
- `templates/STATE.template.md` — esqueleto del tablero, con los marcadores que separan lo generado de lo narrativo.
- `templates/state-recipes.md` — cómo renderizar cada bloque del tablero y de dónde sale cada dato.
- `scripts/state-check.sh` — verifica que el tablero coincida con los archivos de spec. Solo lectura; sale 1 ante cualquier deriva.
