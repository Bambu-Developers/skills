---
name: bambu-documentos
description: Genera documentos Word (.docx) editables con la identidad visual de Bambú Tech Services (Lexend y Noto Sans, verde Bambú, portada, encabezado con logos, pie numerado, índice, tablas y firmas) a partir de un archivo de datos. Plantillas para minuta/acta de reunión, informe (técnico, de avance, diagnóstico, auditoría, incidente, ejecutivo), propuesta técnica o de servicio, y manual/guía/procedimiento; también documento libre. Úsala cuando pidan "hazme una minuta", "acta de la reunión", "informe de avance", "reporte técnico", "propuesta técnica", "manual de usuario", "guía de instalación", "documento Word con formato Bambú", "meeting minutes", "progress report" o "technical proposal" en .docx. No es para cotizar desde casos de uso (bambu-cotizador), documentar casos de uso (use-case-docs) ni contar cambios del cliente (control-cambios).
---

# Documentos Bambú

Produce un `.docx` editable con la identidad visual de Bambú Tech Services a partir de un archivo de datos. El motor (`scripts/build_doc.js`) ya resuelve todo el diseño — portada, encabezado con logos, pie con barra verde y numeración, índice, tipografías, paleta, tablas, listas, notas y firmas — de modo que el trabajo de cada documento es **el contenido**, no el formato. No reescribir estilos ni crear otro script de generación: si el motor no hace algo, extenderlo.

## Flujo de trabajo

1. Identificar el tipo de documento y elegir plantilla.
2. Recopilar los datos que faltan (una sola intervención).
3. Redactar el contenido en el archivo de datos.
4. Generar el `.docx`.
5. Verificar visualmente y entregar.

---

## Paso 1 — Elegir plantilla

| El usuario pide… | Plantilla |
|---|---|
| Minuta, acta, resumen de reunión, acuerdos de una sesión | `templates/minuta.js` |
| Informe, reporte técnico, de avance, diagnóstico, auditoría, incidente, ejecutivo | `templates/informe.js` |
| Propuesta técnica, de solución o de servicio (inversión ya definida) | `templates/propuesta.js` |
| Manual, guía de usuario, de operación, de instalación, procedimiento | `templates/manual.js` |
| Cualquier otro documento formal | Documento libre: construir secciones con los bloques del esquema |

Leer `references/plantillas.md` en la sección del tipo elegido: define estructura, datos a confirmar y criterios de redacción de cada uno.

Si la petición es en realidad otra skill de Bambú, redirigir: identificar o contar cambios solicitados por el cliente → `/control-cambios`; cotizar desde casos de uso → `/bambu-cotizador`; especificar casos de uso → `/use-case-docs`.

## Paso 2 — Recopilar datos faltantes

Nunca inventar datos que aparecen en la portada o que comprometen a Bambú: fechas, montos, plazos, nombres de participantes, firmantes, versión del sistema. Un dato inventado en un entregable de cliente se lee como compromiso.

Antes de preguntar, revisar lo que ya está disponible: la conversación, archivos adjuntos, documentos previos del proyecto. Preguntar solo lo que no se puede obtener, en una sola intervención compacta. Normalmente:

- **Nombre comercial del cliente** (nunca la razón social).
- **Propósito del documento:** para quién es y qué decisión o acción habilita. Va en la portada.
- Los datos específicos que `references/plantillas.md` marca para el tipo elegido.
- **Participantes y su organización** cuando vienen de una transcripción: presentarlos en una tabla (Detectado · Organización inferida) para que el usuario corrija en línea.

Si un dato menor no se conoce y no es crítico, escribir "Por definir" en lugar de inventarlo, y mencionarlo al entregar.

## Paso 3 — Redactar el archivo de datos

Copiar la plantilla a un archivo temporal fuera del repo del usuario (p. ej. `"$(mktemp -d)/datos.js"`) y reemplazar todo lo que esté entre `‹ ›`. El esquema completo de `meta`, `secciones` y los 14 tipos de bloque está en `references/data-schema.md`; leerlo antes de construir un documento libre o usar bloques que la plantilla no trae.

### Reglas de redacción

Estas reglas vienen del formato de control-cambios y son las que hacen que un documento Bambú se lea como un entregable profesional:

- **Prosa profesional, no telegrama.** Cada sección debe entenderla alguien que no estuvo presente. Las viñetas son para listas genuinas, no para trocear razonamientos.
- **No narrar cómo se elaboró el documento.** Nada de "a partir de la transcripción", "se revisó el código", "este documento fue generado". El documento presenta contenido, no metodología.
- **No pedir accesos ni herramientas dentro del documento.** Si falta información, la redacción es que el punto queda sujeto a revisión o por definir.
- **Vocabularios cerrados en celdas** (estados, severidades, prioridades). El matiz va en el texto, porque los textos largos rompen las columnas.
- **Barras negras (`barra`) para sub-bloques** dentro de una sección y `subtitulo` (H2) para divisiones que deben aparecer en el índice. Es el ritmo visual característico de los documentos Bambú.
- **Identificadores** (`A-01`, `P-01`, `H-01`…) cuando los elementos se referencian después; ver la tabla en `references/data-schema.md`.
- **Idioma:** español de México, salvo que el usuario pida otro.

## Paso 4 — Generar

```bash
NODE_PATH="$(npm root -g)" node <skill>/scripts/build_doc.js <datos.js> "<destino>/<Tipo>_<Proyecto>_v1.0.docx"
```

`<skill>` es el directorio donde está este SKILL.md. `<destino>` es la carpeta que indique el usuario; si no indica ninguna, el directorio de trabajo actual. Requiere el paquete `docx` de npm; si `require('docx')` falla: `npm install -g docx` y repetir (así no se crea `node_modules` dentro del repo).

El script valida antes de escribir y aborta con la lista de problemas si hay campos de portada vacíos, filas de tabla con un número de celdas distinto a los encabezados, tipos de bloque desconocidos o imágenes inexistentes. Corregir los datos y volver a ejecutar; no forzar el paso.

Nombre del archivo: `Minuta_<Proyecto>_<AAAA-MM-DD>.docx`, `Informe_<Tema>_v1.0.docx`, `Propuesta_<Cliente>_v1.0.docx`, `Manual_<Sistema>_v1.0.docx`. Sin espacios ni acentos.

## Paso 5 — Verificar y entregar

Instalar las fuentes de marca (para que el PDF de verificación se vea como en Word), convertir con LibreOffice y revisar las páginas. Requiere `soffice` (LibreOffice) y `pdftoppm` (poppler); si faltan, decirlo y entregar el `.docx` sin verificación visual, indicándolo.

```bash
# fuentes: macOS → ~/Library/Fonts · Linux → ~/.fonts (y fc-cache -f)
cp <skill>/assets/*.ttf ~/Library/Fonts/
V="$(mktemp -d)"
soffice --headless --convert-to pdf "<destino>/<archivo>.docx" --outdir "$V"
pdftoppm -jpeg -r 70 "$V/<archivo>.pdf" "$V/pg"
```

Ver las imágenes y comprobar: que ningún identificador o encabezado de tabla quede partido; que no haya páginas casi vacías por un `nuevaPagina` innecesario; que los totales cuadren; que no quede ningún `‹ ›` de la plantilla (`grep -c "‹" datos.js` debe dar 0); y que no haya frases que narren la elaboración. El PDF es solo para verificar: no entregarlo salvo que el usuario lo pida.

Entregar indicando la ruta completa del `.docx` y un resumen breve: qué tipo de documento es, cuántas secciones, y cualquier dato que haya quedado como "Por definir" o que se haya asumido.

Recordar al usuario, solo la primera vez, que si el índice aparece vacío en Word basta con clic derecho → Actualizar campos (F9).

---

## Archivos de la skill

| Archivo | Cuándo leerlo |
|---|---|
| `references/plantillas.md` | Siempre, en la sección del tipo de documento elegido. |
| `references/data-schema.md` | Al construir un documento libre o usar bloques que la plantilla no trae. |
| `templates/*.js` | Punto de partida del archivo de datos. |
| `scripts/build_doc.js` | Solo si hay que extender el motor (nuevo tipo de bloque). Mantener la paleta y los componentes existentes. |
| `assets/` | Logos, barra de pie y tipografías. No modificar. |
