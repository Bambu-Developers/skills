# Protocolo de memoria de agentes

Los subagentes son **stateless**: cada invocación arranca en blanco y no recuerda nada de la anterior. Este directorio es la memoria que les falta — persistente, versionada en git, legible por humanos.

Lo lee y lo escribe el propio agente con `memory.sh`. Un agente sin bloque de memoria en su prompt no participa de esto.

## Estructura

```
.claude/agents/memory/
  PROTOCOL.md              ← este archivo
  memory.sh                ← recall / remember / forget / check
  <nombre-del-agente>/
    MEMORY.md              ← índice: una línea por recuerdo (lo único compartido)
    <slug>.md              ← un recuerdo = un archivo = un hecho
```

Un hecho por archivo. Es lo que hace que dos ramas paralelas puedan agregar recuerdos sin pelearse: el único archivo con riesgo de conflicto es `MEMORY.md`, y resolverlo es ordenar líneas.

## Memoria vs. specs — la frontera

Un **spec** es el contrato de **una** iniciativa: qué se va a construir, con su alcance y sus criterios. Vive en `specs/`, tiene ciclo de vida, y es la fuente de verdad de ese feature.

La **memoria** es lo que **cruza** specs o los **precede**: el vocabulario del dominio, quién decide qué, la restricción que condiciona todo análisis futuro, la decisión que se tomó una vez y nadie quiere volver a discutir.

**Si un spec ya lo registra, no lo copies — apunta al `SPEC NN`.** Memoria duplicada es memoria que se desactualiza en silencio mientras el spec evoluciona.

Tampoco guardes lo que el repo ya dice: estructura de carpetas, convenciones del `CLAUDE.md`, historia de git, cómo está implementado algo. Eso se lee, no se recuerda.

## Qué sí se guarda

| Tipo | Qué es | Ejemplo |
|---|---|---|
| `dominio` | Vocabulario, actores y reglas de negocio del sistema que ningún spec define solo | Qué significa exactamente "ciclo escolar" aquí y cuándo corta |
| `decision` | Algo ya decidido, con su razón y su fecha | "Se descartó multi-tenant el 2026-10-14 porque la fundación es una sola entidad legal" |
| `restriccion` | Límite técnico, legal u organizacional que condiciona cualquier análisis | "El SIS externo solo expone lectura; nada se escribe de vuelta" |
| `stakeholder` | Quién decide qué y a quién hay que preguntarle — **por rol, nunca por persona** | "Las reglas de cobranza las define Finanzas, no Admisiones" |
| `leccion` | Dónde falló un análisis previo, para no repetirlo | "Asumí que 'alumno activo' incluía bajas temporales; no las incluye" |

## Qué nunca se guarda

- **Datos personales.** Ni nombres propios, ni correos, ni datos de alumnos, padres o empleados. Siempre el rol (`el coordinador de admisiones`), nunca la persona. Esta memoria se commitea y la ve todo el que tenga acceso al repo.
- Credenciales, tokens, endpoints internos con llaves.
- Lo efímero: "el usuario hoy pidió X". Si no va a servir dentro de tres meses, no es memoria.
- Lo que ya está en un spec, en el `CLAUDE.md` o en el código.

## Formato de un recuerdo

```markdown
---
name: ciclo-escolar-corta-en-julio
description: El ciclo escolar corre de agosto a julio, no coincide con el año fiscal
type: dominio
date: 2026-11-02
source: SPEC 03 | conversación con el equipo | src/core/calendar.ts:42
---

El ciclo escolar corre de agosto a julio. El año fiscal de la fundación corre
de enero a diciembre. No coinciden.

**Por qué importa:** cualquier reporte "del año" es ambiguo hasta que alguien
diga cuál de los dos.

**Cómo aplicarlo:** ante cualquier requisito con corte anual, preguntar cuál
de los dos calendarios aplica antes de escribir el spec. Relacionado:
[[reportes-anuales-ambiguos]].
```

Fechas **siempre absolutas** (`2026-11-02`), nunca "la semana pasada" — un recuerdo se lee meses después, cuando "la semana pasada" ya no significa nada.

Enlaza recuerdos relacionados con `[[nombre-del-slug]]`. Un enlace a un recuerdo que todavía no existe no es un error: marca algo que vale la pena escribir después.

## Protocolo del agente

**Al arrancar — recall.** Antes de cualquier otro trabajo:

```bash
.claude/agents/memory/memory.sh recall <nombre-del-agente>
```

Devuelve el índice. Lee **solo** los archivos cuya `description` sea relevante a lo que tienes enfrente — cargar los 40 recuerdos en cada invocación derrota el propósito.

**Al cerrar — remember.** Solo lo que pasa estas tres pruebas a la vez:

1. **Durable** — seguirá siendo cierto dentro de tres meses.
2. **No derivable** — no se puede averiguar leyendo el repo, un spec o git.
3. **Costoso de reaprender** — si se pierde, alguien vuelve a preguntar o a equivocarse.

```bash
.claude/agents/memory/memory.sh remember <agente> <slug> <tipo> "<description>" <<'EOF'
<el cuerpo del recuerdo>
EOF
```

Antes de escribir, **busca si ya existe** un recuerdo que cubra lo mismo. Actualiza ese archivo en vez de crear un duplicado — `remember` sobre un slug existente lo reemplaza y conserva la línea del índice.

**Cuando algo resulte falso — forget.** Un recuerdo equivocado hace más daño que no tener memoria, porque se cita con confianza:

```bash
.claude/agents/memory/memory.sh forget <agente> <slug>
```

**Verificación.** `memory.sh check [agente]` compara índice contra archivos y sale 1 ante cualquier deriva. Es solo lectura.

## Reglas duras

- **Nunca** edites `MEMORY.md` a mano — `remember` y `forget` lo mantienen. Un índice parchado a mano se desincroniza del directorio.
- **Nunca** guardes un dato personal. Rol, siempre.
- **Nunca** dupliques lo que vive en un spec — apunta al `SPEC NN`.
- **Nunca** escribas un recuerdo con fecha relativa.
- **Nunca** trates la memoria como fuente de verdad sobre el código: si un recuerdo y el repo se contradicen, **gana el repo**, y el recuerdo se corrige o se olvida. Un recuerdo que nombra un archivo, una función o una ruta se verifica antes de citarlo.
- **Nunca** acumules por si acaso. Memoria que nadie lee es ruido que encarece cada invocación.
