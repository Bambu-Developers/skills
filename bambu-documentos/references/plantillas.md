# Guía de contenido por plantilla

Cada plantilla es un punto de partida, no un molde rígido: se pueden quitar secciones que no aplican y agregar las que el contenido pida. Lo que no cambia es la identidad visual y las reglas de redacción del SKILL.md.

## Contenido
- Minuta de reunión
- Informe
- Propuesta
- Manual
- Documento libre

---

## Minuta de reunión — `templates/minuta.js`

**Cuándo:** el usuario comparte notas, transcripción o resumen de una reunión y quiere dejar constancia de lo tratado, los acuerdos y los pendientes. Si lo que pide es **identificar, contar o estimar cambios solicitados por el cliente**, no es una minuta: es `/control-cambios`.

**Datos a confirmar antes de generar:** fecha, participantes y la organización de cada uno (las transcripciones automáticas confunden nombres parecidos y no distinguen de qué lado de la mesa habla cada quien), nombre comercial del cliente.

**Estructura:** Datos de la sesión (participantes, agenda) → Desarrollo por tema → Acuerdos (`A-nn`) → Pendientes con responsable y fecha (`P-nn`) → Próxima sesión → Firmas (solo si se pide).

**Criterios:**
- Sin índice (`indice: false`) y con secciones encadenadas (`nuevaPagina: false`): una minuta se lee de corrido.
- El desarrollo resume conclusiones por tema; no transcribe el diálogo ni atribuye frases textuales.
- Un acuerdo es un compromiso verificable ("Bambú entregará el ambiente de QA el 15 de octubre"), no una intención ("se revisará").
- Todo pendiente tiene un responsable con nombre y organización. Si la fecha no se acordó, escribir "Por definir"; no inventarla.

## Informe — `templates/informe.js`

**Cuándo:** informe técnico, de avance, de diagnóstico, de auditoría, de incidente, ejecutivo para Dirección.

**Datos a confirmar:** para quién es y qué decisión habilita (va en `proposito`), periodo o corte, clasificación de confidencialidad.

**Estructura:** Resumen ejecutivo → Antecedentes y alcance → Hallazgos (`H-nn`, tabla resumen + detalle por hallazgo) → Recomendaciones (`R-nn`, cada una vinculada a los hallazgos que atiende) → Conclusión.

**Criterios:**
- El resumen ejecutivo va primero y se sostiene solo: conclusión, luego el porqué. Quien solo lee esa página debe poder decidir.
- Severidad y prioridad con vocabulario cerrado (`Baja`, `Media`, `Alta`, `Crítica`); el matiz va en el detalle, no en la celda.
- Un informe de incidente agrega una sección de cronología (tabla Fecha/hora · Evento) y otra de causa raíz.
- Un informe de avance agrega una tabla de estado por entregable o fase (Entregable · Avance % · Estado · Observaciones).

## Propuesta — `templates/propuesta.js`

**Cuándo:** propuesta técnica, de solución o de servicio en la que el usuario ya conoce el alcance y la inversión. Si hay que **calcular horas y precio desde una matriz de casos de uso**, usar `/bambu-cotizador`.

**Datos a confirmar:** cliente (nombre comercial), modalidad comercial, montos y moneda, vigencia, firmantes. Nunca inventar cifras de inversión ni plazos.

**Estructura:** Resumen → Entendimiento de la necesidad → Solución (alcance, fuera de alcance, entregables) → Plan de trabajo → Inversión y condiciones (con supuestos) → Aceptación con firmas.

**Criterios:**
- "Entendimiento de la necesidad" se escribe en los términos del cliente: demuestra que se escuchó.
- El fuera de alcance es explícito y concreto; es la sección que protege a Bambú en una negociación posterior.
- Tabla de inversión con `total: true` y columna de importes alineada a la derecha.
- Los supuestos que sostienen la estimación se listan siempre: si cambian, cambia el precio.

## Manual — `templates/manual.js`

**Cuándo:** manual de usuario, de operación, de instalación, de despliegue, técnico o guía de procedimiento.

**Datos a confirmar:** perfil del lector, versión del sistema que documenta, si hay capturas de pantalla disponibles (se insertan con bloques `imagen`).

**Estructura:** Introducción → Requisitos previos → Conceptos clave → Procedimientos (un `subtitulo` por tarea) → Solución de problemas → Historial de versiones.

**Criterios:**
- Pasos en `numerada`, en imperativo, una acción por paso. Los nombres de botones y opciones en **negrita** tal como aparecen en pantalla.
- Comandos, rutas y fragmentos de configuración en bloques `codigo`.
- Advertencias que pueden causar pérdida de datos o un error operativo en `nota` con `variante: 'alerta'`; resultados esperados o tips en `nota` normal.
- Un manual técnico o de instalación agrega secciones de arquitectura, variables de entorno (tabla Variable · Descripción · Ejemplo) y verificación posterior.

## Documento libre

Cuando el documento no encaja en ninguna plantilla (política interna, carta formal, acta de entrega, plan de trabajo, documento de arquitectura, comunicado), construir `secciones` desde cero con los mismos bloques. Proponer al usuario la lista de secciones antes de redactar si el documento pasa de tres secciones.
