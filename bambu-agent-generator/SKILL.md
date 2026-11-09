---
name: bambu-agent-generator
description: Crea subagentes nuevos de Claude Code (`.claude/agents/<nombre>.md`) siguiendo la anatomía de los agentes Bambu — frontmatter con herramientas de mínimo privilegio, una disciplina central auditable, flujo por pasos que abre con `memory.sh recall` y cierra guardando lo aprendido, entregable con estructura fija y reglas duras con su porqué — y conectados al protocolo de memoria persistente versionada en git. También audita y mejora el prompt de un agente existente contra una rúbrica (frontera con sus hermanos, herramientas declaradas vs. usadas, hechos que se pudren, contradicciones, lecciones de su memoria que deberían ser regla del prompt) y propone los cambios como diff. Usa este skill cuando el usuario pida "crea un agente", "necesito un subagente para…", "genera un agente nuevo", "bambu-agent-generator", "quiero un agente que haga X", "mejora el prompt del agente", "revisa el agente bambu-qa", "este agente se está equivocando en…", "audita los agentes", "¿por qué el agente hizo X?", o mencione `.claude/agents/` explícitamente.
---

# Generador y mejorador de agentes Bambu

Un agente Bambu no es un prompt suelto: es un **rol con frontera**, una **disciplina central** que hace auditable su trabajo, y una **memoria** que le permite no reaprender lo mismo en cada invocación. Este skill produce agentes con esa forma —o corrige los que la perdieron— sin que el usuario tenga que recordar la anatomía.

Tiene dos modos. Decide cuál por lo que pidió el usuario:

- **Modo A — Crear**: no existe `.claude/agents/<nombre>.md` para ese rol.
- **Modo B — Mejorar**: el agente existe y el usuario quiere revisarlo, corregir un mal comportamiento, o que "funcione mejor".

Si el rol que piden ya lo cubre un agente existente casi por completo, **no crees otro**: propón el Modo B sobre ese agente. Dos agentes con frontera borrosa se disparan mal y se contradicen.

Archivos del skill (rutas relativas a este `SKILL.md`):

| Archivo | Para qué |
|---|---|
| `references/anatomia.md` | La forma de un agente Bambu, sección por sección, con la razón de cada una. **Léela antes de redactar.** |
| `references/rubrica.md` | Los criterios para auditar un prompt, con señal y arreglo. Es la vara del Modo B y el autochequeo del Modo A. |
| `templates/AGENT.template.md` | El esqueleto a llenar. |
| `scripts/lint-agent.sh` | Chequeo estructural determinista (frontmatter, memoria, secciones, herramientas). |
| `assets/memory/` | `memory.sh` + `PROTOCOL.md`, para instalar el protocolo en un repo que todavía no lo tiene. |

---

## Paso 0 — Leer el sistema que ya existe (ambos modos)

Un agente vive entre hermanos. Antes de escribir una línea:

```bash
ls .claude/agents/*.md 2>/dev/null
for f in .claude/agents/*.md; do sed -n '2,3p' "$f"; done   # name + description de cada hermano
ls .claude/agents/memory/ 2>/dev/null && test -x .claude/agents/memory/memory.sh && echo "memoria instalada"
grep -ln "subagent\|bambu-" .claude/commands/*.md 2>/dev/null   # comandos que orquestan agentes
```

Lee también el `CLAUDE.md` del repo y la lista de skills en `.claude/skills/`. De aquí salen tres cosas que vas a necesitar:

1. **Las fronteras ocupadas** — qué hace cada hermano y qué dice que *no* hace. El agente nuevo se define tanto por lo que hace como por a quién le cede lo demás.
2. **Lo que ya no hay que escribir** — convenciones que el `CLAUDE.md` o una skill ya cubren. El prompt apunta a ellas y declara precedencia; no las copia.
3. **Si el protocolo de memoria existe.** Si no, el Paso A5 lo instala.

## Modo A — Crear un agente

### Paso A1 — Entrevista

Antes de redactar, necesitas respuesta a estas preguntas. **No preguntes lo que el repo o el pedido ya contestan** — infiérelo y dilo como supuesto para que el usuario lo corrija. Pregunta en bloque (con `AskUserQuestion` si estás en la sesión principal), no una por una:

1. **El rol** — ¿qué oficio senior es? ("QA senior", "analista de sistemas senior"). Un oficio, no una tarea.
2. **Inicio y fin** — ¿qué evento hace que alguien lo invoque, y qué tiene que ser verdad para que su trabajo esté terminado?
3. **La frontera** — ¿qué parece trabajo suyo pero no lo es, y qué agente o humano lo hace?
4. **El error más caro** — ¿cuál es la falla de este rol que más cuesta cuando pasa desapercibida? De aquí sale la disciplina central (Paso A2). Si el usuario no lo sabe, propón uno con base en el rol y pídele confirmación.
5. **El entregable** — ¿quién lo lee y qué hace con él? (un orquestador que lo lleva al humano, otro agente, el propio humano).
6. **Herramientas y skills** — ¿necesita navegador, MCP, git, escribir código de aplicación? ¿Qué skills del repo usa y cuál manda si se contradicen?
7. **Autonomía** — ¿qué acciones irreversibles o hacia afuera (push, PR, mover un Status, borrar) podría tocar, y cuáles puede hacer solo vs. nunca?

Si la respuesta a 3 revela que el rol se solapa con un hermano, para y dilo (ver arriba).

### Paso A2 — Encontrar la disciplina central

Es la pieza que distingue a un agente Bambu de un prompt genérico, y la más difícil. Los tres agentes actuales la tienen:

| Agente | Error más caro | Disciplina central |
|---|---|---|
| `bambu-analista-sistemas` | Un supuesto que se vuelve spec aprobado | 4 etiquetas: DICHO / INFERIDO / SUPUESTO / DESCONOCIDO |
| `bambu-qa` | Un FAIL reportado como PASS | 4 veredictos: PASS / FAIL / NO VERIFICABLE AQUÍ / BLOQUEADO |
| `bambu-frontend-developer` | Código que no se puede cambiar sin leer todo lo demás | Estándar reutilizable / escalable / legible, con prueba objetiva |

La receta: toma el error más caro (A1.4) y conviértelo en una **clasificación obligatoria y visible en el entregable**, de modo que quien lea el reporte pueda auditar si el agente la aplicó. Una disciplina que no deja rastro en la salida no es disciplina, es deseo. Detalle en `references/anatomia.md` § 3.

### Paso A3 — Redactar

Copia `templates/AGENT.template.md` a `.claude/agents/<nombre>.md` y llénalo siguiendo `references/anatomia.md`. Lo no negociable:

- **Nombre** `bambu-<rol>` en kebab-case, igual al nombre del archivo.
- **Segunda persona** ("Eres…", "Tu trabajo empieza cuando… y termina cuando…").
- **Cada regla con su porqué.** Una regla sin razón se aplica mal justo en el borde donde importa. Si no sabes el porqué, pregúntalo o no pongas la regla.
- **Tablas para decisiones de clasificación** (qué herramienta para qué tipo de criterio, qué acción puede hacer solo); prosa para el razonamiento.
- **Comandos concretos**, no "verifica que compile": `npm run build`, con la ruta y el flag.
- **Nada que se pudra.** Conteos, versiones, "el repo todavía no tiene X", nombres de archivo que van a moverse: eso se **lee del repo** en un paso, o es **memoria**. El prompt cambia por PR; el repo cambia todos los días.
- **No copies el `CLAUDE.md`** ni una skill: nómbralos y declara la cadena de precedencia (`CLAUDE.md` → skill de arquitectura → … → este prompt).
- Mientras el agente sea sobre el **cómo trabajar**, el prompt cabe en 150–300 líneas. Si se pasa, el detalle técnico se va a una skill que el agente invoca.

### Paso A4 — Frontmatter

```yaml
name: bambu-<rol>
description: <Oficio> senior. <Qué hace, en una o dos oraciones con el entregable>. <La disciplina central en una frase>. Úsalo <disparadores concretos: después de X, antes de Y, cuando el usuario pida Z>. No <lo que no hace> — eso es `<agente-hermano>`.
tools: <lista explícita>
model: opus | sonnet
effort: low | medium | high
color: <uno que ningún hermano use>
```

- **`description`** es lo que lee el orquestador para decidir a quién llamar. Los disparadores y la frontera ("No hace X — eso es Y") pesan más que la descripción del rol.
- **`tools`**: deriva la lista **de los pasos que escribiste**, no al revés. Cada herramienta que un paso nombra va declarada (si no, el paso falla en silencio); cada herramienta declarada que ningún paso usa es privilegio de más. `Bash` es obligatoria (memoria). `Skill` si invoca skills. Las MCP van una por una, sin comodines.
- **`model` / `effort`** — patrón observado: juicio y ambigüedad (analista) → `opus` + `high`; verificación escéptica (QA) → `opus` + `medium`; ejecución con reglas claras (developer) → `sonnet` + `medium`. Es un punto de partida, no una ley.

### Paso A5 — Conectar la memoria

Si `.claude/agents/memory/memory.sh` no existe en el repo, instálalo desde este skill y avísalo en el reporte:

```bash
mkdir -p .claude/agents/memory
cp <ruta-del-skill>/assets/memory/memory.sh <ruta-del-skill>/assets/memory/PROTOCOL.md .claude/agents/memory/
chmod +x .claude/agents/memory/memory.sh
```

No crees el directorio `memory/<nombre>/` ni un `MEMORY.md` vacío: `memory.sh remember` lo crea con el primer recuerdo, y `recall` ya maneja la primera invocación.

En el prompt, el **Paso 0** es siempre `recall` y el **último paso** es siempre "Guardar lo aprendido", con la lista de **qué suele calificar para este rol**, mapeada a los cinco tipos (`dominio`, `decision`, `restriccion`, `stakeholder`, `leccion`). Esa lista específica es lo que hace que la memoria del agente sirva: sin ella, el agente guarda el resultado del turno en vez de lo que cruza turnos. Plantilla exacta en `templates/AGENT.template.md`.

### Paso A6 — Integrar con los hermanos

Un agente nuevo cambia las fronteras de los existentes. Revisa y **propón** (no apliques sin mostrar):

- La `description` y las reglas duras de cada hermano cuyo trabajo el nuevo absorbe o colinda: agrega "No hace X — eso es `<nuevo>`".
- Los comandos de `.claude/commands/` que orquestan agentes: ¿el nuevo entra en algún flujo (`/spec-implement`, `/spec-define`)? Si sí, ese comando necesita un paso que lo invoque.

### Paso A7 — Verificar

```bash
bash <ruta-del-skill>/scripts/lint-agent.sh .claude/agents/<nombre>.md
.claude/agents/memory/memory.sh check
```

El lint debe salir sin `ERROR`. Cada `AVISO` se resuelve o se justifica en el reporte. Después pasa tú mismo la rúbrica (`references/rubrica.md`) sobre el borrador: es la misma vara del Modo B, y es más barato aplicarla antes de que el agente corra que después.

Dile al usuario que los agentes nuevos se cargan al reiniciar la sesión (o con `/agents`), y sugiere una **invocación de humo**: una tarea chica y real donde la disciplina central tenga que aparecer en el entregable.

## Modo B — Mejorar un agente existente

El objetivo no es reescribirlo con tu estilo: es encontrar **por qué se equivoca o se va a equivocar**, con evidencia, y corregir lo mínimo que lo arregla.

### Paso B1 — Juntar evidencia

```bash
cat .claude/agents/<nombre>.md
.claude/agents/memory/memory.sh recall <nombre>
git log --oneline -15 -- .claude/agents/<nombre>.md .claude/agents/memory/<nombre>/
bash <ruta-del-skill>/scripts/lint-agent.sh .claude/agents/<nombre>.md
```

Si el usuario trae un **mal comportamiento concreto** ("el QA dio PASS sin correr el build"), esa es la evidencia principal: busca en el prompt la línea que lo permitió o la ausencia que lo explica. Un arreglo que no apunta a una causa en el prompt es un parche a ciegas.

**La memoria es la mejor fuente de diagnóstico que existe.** Léela como síntoma:

- **Varias `leccion` del mismo tipo** → al prompt le falta una regla. Promuévela a regla (con su porqué) y, con aprobación, `forget` los recuerdos que ya quedan cubiertos.
- **Un recuerdo que es universal al oficio**, no a este repo ("jsdom no resuelve hojas de estilo") → candidato a regla del prompt o a skill.
- **Un hecho del repo escrito en el prompt** (conteo, estado del scaffold, versión) → al revés: sácalo del prompt; o se lee del repo, o es memoria.
- **Un recuerdo citado en el prompt que vive en la memoria de otro agente** → el agente no lo va a encontrar con su `recall`.

### Paso B2 — Pasar la rúbrica

Recorre `references/rubrica.md` completa. Cada hallazgo lleva:

- **Criterio** de la rúbrica que falla.
- **Evidencia** — `archivo:línea` o el recuerdo/commit que lo muestra.
- **Efecto** — qué hará mal el agente por esto, concreto.
- **Arreglo propuesto** — el texto nuevo, mínimo.

Ordénalos por efecto, no por orden de la rúbrica. Si un criterio pasa, no lo listes.

### Paso B3 — Proponer, no aplicar

Muestra los cambios como diff (o como pares antes/después) y **espera la aprobación del usuario** antes de editar. El prompt de un agente es código versionado del que dependen comandos y otros agentes: un cambio de frontera o de herramientas puede romper un flujo de orquestación que no estás mirando.

Al aplicar:

- **Conserva la voz y la estructura** del agente. Arreglar no es reescribir.
- Si cambias la frontera o la `description`, revisa a los hermanos y los comandos (Paso A6).
- Si promoviste recuerdos a regla, haz el `forget` aprobado y corre `memory.sh check <nombre>`.
- Corre `lint-agent.sh` otra vez y reporta la salida literal.

### Paso B4 — Auditar todos

Si el usuario pide "audita los agentes", corre el lint sobre todos y la rúbrica sobre cada uno, y entrega una tabla agente × hallazgos ordenada por efecto. Además, revisa los problemas **entre** agentes: fronteras que se solapan, colores repetidos, un comando que invoca a un agente con una expectativa que su prompt no cumple.

## Reporte final

- **Qué hice** — creé / mejoré `<ruta>`, en una oración.
- **Disciplina central** (Modo A) — cuál y de qué error más caro sale.
- **Hallazgos** (Modo B) — tabla criterio / evidencia / efecto / arreglo, y cuáles se aplicaron.
- **Cambios en hermanos y comandos** — propuestos y aplicados, por separado.
- **Verificación** — salida literal de `lint-agent.sh` y `memory.sh check`.
- **Siguiente paso** — reiniciar sesión y la invocación de humo sugerida.

## Reglas clave

1. **Nunca crees un agente cuya frontera se solape con un hermano** sin antes proponer extender al hermano.
2. **Nunca escribas una regla sin su porqué.** Si no la sabes, pregúntala.
3. **Nunca declares una herramienta que ningún paso usa, ni nombres en un paso una que no está declarada.**
4. **Nunca metas en el prompt un hecho que se pudre** — se lee del repo o va a memoria.
5. **Nunca copies el `CLAUDE.md` ni una skill dentro del prompt** — nómbralos y declara precedencia.
6. **Nunca apliques cambios a un agente existente sin mostrarlos y obtener aprobación**, ni reescribas su voz para arreglar una línea.
7. **Nunca edites `MEMORY.md` a mano ni olvides recuerdos sin aprobación** — todo pasa por `memory.sh`.
8. **Nunca entregues sin correr `lint-agent.sh`** y pegar su salida.
