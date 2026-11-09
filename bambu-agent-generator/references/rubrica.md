# Rúbrica para auditar el prompt de un agente

Cada criterio tiene una **señal** (cómo lo detectas leyendo) y un **arreglo** (qué cambia en el prompt). Los marcados con 🔧 los revisa también `scripts/lint-agent.sh`; el resto es juicio y es tuyo.

Reporta solo los que fallan, ordenados por **efecto** (qué hará mal el agente), no por número.

## A. Disparo y frontera

**A1. La `description` dispara bien.** 🔧
- Señal: falta "Úsalo cuando/después de/antes de…" con eventos concretos; o la description describe el rol pero no cuándo llamarlo.
- Arreglo: agregar 2–4 disparadores reales del flujo del equipo ("después de que `bambu-frontend-developer` reporte terminado").

**A2. La frontera está declarada.** 🔧
- Señal: no hay "No hace X — eso es `Y`" en la description, ni negaciones en la identidad ("No programas. No apruebas nada.").
- Arreglo: nombrar lo que parece suyo y no lo es, y a quién le toca.

**A3. No se solapa con un hermano.**
- Señal: dos descriptions disparan con el mismo pedido; o el agente hace en un paso lo que otro declara como suyo.
- Arreglo: mover el trabajo a uno solo y agregar la cesión explícita en el otro.

**A4. Inicio y fin verificables.**
- Señal: no se sabe cuándo el agente terminó; "termina cuando todo esté bien".
- Arreglo: "termina cuando <condición que un tercero puede comprobar>".

## B. Disciplina

**B1. Hay una disciplina central.**
- Señal: el prompt es una lista de buenas prácticas sin una regla que organice el entregable.
- Arreglo: identificar el error más caro del rol y convertirlo en clasificación obligatoria (ver `anatomia.md` § 3).

**B2. La disciplina deja rastro en el entregable.**
- Señal: las etiquetas/veredictos se definen arriba pero "Cómo entregas" no los pide.
- Arreglo: la estructura del reporte exige la clasificación por ítem.

**B3. Existe la categoría incómoda.**
- Señal: no hay forma legítima de decir "no sé" / "no pude verificar" / "bloqueado".
- Arreglo: agregarla. Sin ella el modelo redondea hacia la categoría cómoda.

## C. Instrucciones

**C1. Cada regla tiene su porqué.**
- Señal: reglas en imperativo puro, sin consecuencia; sobre todo en "Reglas duras" que no aparecen explicadas en el cuerpo.
- Arreglo: una cláusula con la consecuencia concreta. Si nadie sabe el porqué, preguntar si la regla sigue viva.

**C2. Los pasos terminan en algo observable.**
- Señal: "considera", "ten en cuenta", "asegúrate de que" sin cómo.
- Arreglo: comando, archivo o clasificación concreta.

**C3. No hay contradicciones internas.**
- Señal: un paso permite lo que una regla dura prohíbe; dos pasos dan órdenes opuestas; el prompt contradice al `CLAUDE.md` sin declarar precedencia.
- Arreglo: resolver a favor de uno y declarar la precedencia.

**C4. No duplica el `CLAUDE.md` ni una skill.**
- Señal: párrafos que repiten convenciones que ya están en otro archivo versionado.
- Arreglo: reemplazar por "léelo / invoca la skill" + cadena de precedencia. La copia se desincroniza en silencio.

**C5. Nada se pudre.**
- Señal: conteos, versiones menores, "el repo todavía no tiene…", rutas de archivos concretos de features, nombres de personas.
- Arreglo: o un paso que lo lea del repo, o un recuerdo en memoria. Ejemplo real: el developer dice "el repo está en estado de scaffold: `src/app/` solo tiene `app.*`" cuando ya existen `core/`, `features/`, `layouts/`, `shared/`.

**C6. Longitud proporcional.**
- Señal: más de ~300 líneas, o secciones de referencia técnica (APIs, recetas) dentro del prompt.
- Arreglo: mover la referencia a una skill que el agente invoca; el prompt se queda con el cómo trabajar.

## D. Herramientas y autonomía

**D1. Herramientas declaradas = herramientas usadas.** 🔧
- Señal: un paso dice "invoca la skill" y `Skill` no está en `tools`; un paso usa `mcp__x__y` no declarado; o hay herramientas declaradas que ningún paso menciona.
- Arreglo: alinear la lista con los pasos.

**D2. Autonomía explícita para lo irreversible.**
- Señal: el agente puede hacer push, abrir PR, mover un Status, borrar archivos, y el prompt no dice cuándo sí y cuándo no.
- Arreglo: tabla solo / solo si la invocación lo pidió / nunca.

**D3. Sabe que no puede conversar.** 🔧
- Señal: el prompt dice "pregúntale al usuario" sin aclarar que es subagente.
- Arreglo: "no puedes conversar: devuélvelo como pregunta bloqueante".

**D4. Verifica con salida vista.**
- Señal: no hay paso de verificación, o permite reportar resultados que el agente no corrió.
- Arreglo: "nunca describas una salida que no viste" + comandos exactos.

## E. Memoria

**E1. Paso 0 es `recall` con el nombre correcto.** 🔧

**E2. El último paso guarda con lista específica del rol.** 🔧 (estructura) + juicio (contenido)
- Señal: el paso de memoria es genérico; no dice qué suele calificar para este rol ni qué no se guarda.
- Arreglo: 3–5 ejemplos del rol mapeados a tipo, y "no guardes <el resultado de este turno>".

**E3. Los slugs citados existen en la memoria propia.** 🔧
- Señal: el prompt cita un recuerdo por slug que vive en el directorio de otro agente o que ya no existe.
- Arreglo: copiar el recuerdo al agente correcto con `remember`, o quitar la cita. Ejemplo real: `bambu-qa` cita `verificacion-visual-con-probe-efimero`, que vive en la memoria del analista.

**E4. La memoria no está corrigiendo al prompt.**
- Señal: varias `leccion` del mismo tipo; recuerdos que son reglas universales del oficio.
- Arreglo: promover a regla del prompt (con su porqué) y `forget` lo que quede cubierto, con aprobación.

**E5. La memoria no está inflada.**
- Señal: el índice pasa de ~60 líneas, hay recuerdos casi duplicados, o recuerdos que son el resultado de un spec.
- Arreglo: proponer consolidaciones y `forget`; apuntar al `SPEC NN` en vez de duplicarlo.

## F. Entre agentes (solo en auditoría de todos)

**F1. Colores únicos.** 🔧 (con varios archivos)
**F2. Los comandos de orquestación piden lo que el agente entrega** — si `/spec-implement` espera "veredicto global", el agente tiene esa sección.
**F3. Las cesiones son recíprocas** — si A dice "eso es `B`", B no dice "eso es `A`" de lo mismo.
