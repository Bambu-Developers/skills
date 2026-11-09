# Anatomía de un agente Bambu

Derivada de los agentes que ya funcionan en producción (`bambu-analista-sistemas`, `bambu-frontend-developer`, `bambu-qa`). Cada sección existe por una razón; si un agente nuevo omite una, debe ser porque esa razón no aplica, no por olvido.

```
---  frontmatter  ---                 § 1
Identidad y frontera                   § 2
## La disciplina central               § 3
## <Contexto verificado / skills>      § 4  (opcional)
## Flujo de trabajo
   ### Paso 0 — Recordar               § 5
   ### Paso 1..N                       § 6
   ### Paso N-1 — Verificar            § 7
   ### Paso N — Guardar lo aprendido   § 5
## Cómo entregas                       § 8
## Reglas duras                        § 9
```

## § 1 — Frontmatter

| Campo | Regla | Por qué |
|---|---|---|
| `name` | `bambu-<rol>`, kebab-case, igual al archivo | Es la llave de `memory.sh recall <name>`: si difiere, el agente lee la memoria de nadie. |
| `description` | Oficio + qué hace + disciplina + `Úsalo cuando…` + `No hace X — eso es Y` | La lee el orquestador para elegir agente. Sin disparadores no lo llaman; sin frontera lo llaman para lo que no es. |
| `tools` | Lista explícita, derivada de los pasos | Herramienta nombrada y no declarada = paso que falla en silencio. Declarada y no usada = privilegio de más. |
| `model` / `effort` | Juicio → opus/high · verificación → opus/medium · ejecución → sonnet/medium | El costo se paga en cada invocación; el error de juicio se paga en retrabajo. |
| `color` | Distinto al de los hermanos | Es como el humano distingue quién habla en la terminal. |

## § 2 — Identidad y frontera

Dos párrafos cortos, antes de cualquier encabezado:

1. `Eres un <oficio> senior. Tu trabajo empieza cuando <evento> y termina cuando <condición verificable>. No <A>. No <B>.` — Las negaciones son la frontera, en voz del propio agente.
2. `Tu valor no está en <lo obvio del rol>: está en <lo que nadie más hace>.` — Le dice al modelo dónde poner el esfuerzo cuando el tiempo no alcanza para todo.

Ejemplos reales: el analista "no está en escribir rápido lo que te dijeron: está en lo que notas que nadie dijo"; QA "no está en repetir lo que el desarrollador ya dijo que corrió: está en encontrar el criterio que nadie corrió de verdad".

## § 3 — La disciplina central

Una sola regla, con nombre, que convierte el error más caro del rol en una **clasificación obligatoria y visible en el entregable**.

Estructura:

```markdown
## La disciplina central: <nombre corto>

<Una oración: toda X que produzcas cae en una de N categorías, y la marcas explícitamente.>

- **CATEGORÍA A** — qué significa + qué evidencia exige.
- **CATEGORÍA B** — …
- **CATEGORÍA C** — la incómoda: la que el modelo tendería a evitar (DESCONOCIDO, NO VERIFICABLE AQUÍ).

<El error más caro, nombrado: "Un X presentado como Y es el fallo más caro que puedes cometer: <consecuencia concreta en el flujo>".>
```

Qué la hace funcionar:

- **Las categorías son exhaustivas** — todo cae en alguna; si no, el agente inventa una quinta.
- **Hay una categoría para "no sé" / "no pude"**. Sin ella, el modelo redondea hacia la categoría cómoda.
- **Cada categoría exige evidencia distinta**, para que marcar la equivocada se note.
- **La consecuencia del error es concreta y del flujo real** ("el spec se cierra como Implemented con un defecto adentro"), no abstracta ("la calidad baja").

Un agente de ejecución (como el developer) puede tener un *estándar* en vez de etiquetas, pero entonces necesita una **prueba objetiva** de ese estándar ("¿sus `input()` mencionan un tipo del dominio? Entonces no es primitivo").

## § 4 — Contexto verificado y skills (opcional)

Solo si el agente depende de un stack o de skills:

- **Stack verificado** — solo lo que no cambia seguido y condiciona todo (zoneless, Tailwind v4 CSS-first). Nunca conteos ni "el repo todavía no tiene X": eso se pudre (el developer actual dice "el repo está en estado de scaffold" cuando ya hay cuatro capas).
- **Skills y cuál manda** — una línea por skill con *qué* aporta (el cómo / el dónde / cómo se entrega), y la **cadena de precedencia** explícita: `CLAUDE.md` → skill de proyecto → skill genérica → este prompt.
- **Choques resueltos de antemano** — si una skill genérica enseña algo que el proyecto prohíbe, dilo aquí con la razón ("la guía oficial te enseñará `httpResource` en el componente. Aquí no.").

## § 5 — Memoria: Paso 0 y último paso

Fijos en todo agente con memoria. **Paso 0 — Recordar:**

~~~markdown
### Paso 0 — Recordar

Arrancas sin contexto de invocaciones anteriores. Lo primero, siempre:

```bash
.claude/agents/memory/memory.sh recall <name>
```

<Una oración: qué tipo de cosas hay ahí PARA ESTE ROL.> Lee solo los recuerdos cuya `description` toque lo que tienes enfrente:

```bash
.claude/agents/memory/memory.sh recall <name> <slug> <slug>
```

Protocolo completo en `.claude/agents/memory/PROTOCOL.md`. **Si un recuerdo y <la fuente de verdad del rol: el código / el navegador> se contradicen, gana <esa fuente>** — y corriges el recuerdo en el Paso N.
~~~

**Último paso — Guardar lo aprendido:** las tres pruebas (durable, no derivable, costoso de reaprender), la lista **específica del rol** de qué suele calificar mapeada a tipo, el comando `remember`, "revisa el índice antes / actualiza en vez de duplicar / `forget` si resultó falso", cierre con `memory.sh check <name>`, y la frontera: **qué NO guarda este rol** (casi siempre: el resultado de este turno).

La lista específica es la parte que más se omite y la que más importa. Comparar:

- Analista: decisión del humano al contestar una pregunta abierta → `decision` ("lo más valioso que produces").
- QA: limitación de herramienta → `restriccion`; falso positivo que casi reporta → `leccion`.
- Developer: decisión de patrón y su razón → `decision`; enfoque que falló → `leccion`.

Los recuerdos que el prompt cita por slug (p. ej. "memoria: `verificacion-visual-con-probe-efimero`") tienen que vivir en la memoria **de ese agente**: `recall` solo lee su propio directorio.

## § 6 — Pasos del flujo

- Numerados, con verbo en el título (`### Paso 2 — Clasificar cada criterio antes de ejecutar nada`).
- Cada paso termina en **algo observable**: un archivo, una salida de comando, una clasificación. "Considera", "ten en cuenta" y "asegúrate" sin cómo no son pasos.
- El orden importa y se dice por qué cuando no es obvio ("Build primero, siempre: si no compila, ninguna verificación de navegador tiene sentido").
- **Tablas** cuando el paso es una decisión por casos (tipo de criterio → herramienta; acción → ¿solo o nunca?). **Prosa** cuando es razonamiento.
- Si el agente puede tocar algo irreversible o hacia afuera (git push, PR, Status de un spec), un paso tiene la **tabla de autonomía**: qué puede hacer solo, qué solo si la invocación lo pidió, qué nunca.

## § 7 — Verificar antes de cerrar

Penúltimo paso, siempre. La regla compartida por los tres: **nunca describas una salida que no viste con tus propios comandos**. Incluye los comandos exactos y qué hacer si fallan ("si algo no compila, eso es el reporte — no un detalle al final"). Incluye limpieza de lo que el agente levantó (devserver, pestañas, probes efímeros).

## § 8 — Cómo entregas

```markdown
## Cómo entregas

Corres como subagente: **no puedes conversar con el usuario**. <Qué hacer con una ambigüedad: detente y devuélvela como pregunta concreta / conviértela en ítem de "Preguntas abiertas".>

Tu reporte final, en español, <breve>:

- **<Sección>** — qué contiene.
- …
- **Memoria** — qué guardaste o actualizaste.

Sin narrar el proceso paso a paso. Quien te invocó puede leer los archivos.
```

La estructura es fija para que el orquestador (`/spec-implement`, `/spec-define`) pueda leerla sin adivinar. La disciplina central tiene que **aparecer** en ella (las etiquetas, los veredictos por criterio).

## § 9 — Reglas duras

- Lista de `- **Nunca** <acción concreta> — <razón corta si no es obvia>.`
- Cada una corresponde a un costo real que ya pasó o que el rol hace probable. Una lista de 40 "nunca" genéricos se lee como ruido y se ignora entera.
- Son el **resumen** de lo que el cuerpo ya explicó con su porqué, no reglas nuevas que aparecen solo aquí.
- Siempre incluye las de memoria: nunca datos personales (rol, no persona); nunca duplicar lo que un spec registra (apunta al `SPEC NN`).
- Siempre incluye la frontera con hermanos: "Nunca <trabajo del hermano> — eso es `<hermano>`".
