# Esquema del archivo de datos — `build_doc.js`

El archivo de datos es un módulo de Node que exporta `{ meta, secciones }`. El script valida todo antes de escribir y aborta con la lista de problemas; corregir los datos y volver a ejecutar.

## Contenido
1. `meta` — portada, pie e índice
2. `secciones`
3. Bloques (14 tipos)
4. Formato en línea
5. Convenciones de identificadores

---

## 1. `meta`

| Campo | Obligatorio | Uso |
|---|---|---|
| `tipo` | Sí | Título grande de la portada (se pone en MAYÚSCULAS). También alimenta el pie. Ej. `'Minuta de reunión'`. |
| `titulo` | Sí | Subtítulo verde de la portada. El nombre concreto del documento. |
| `subtitulo` | No | Línea negra en negrita bajo el título (convocatoria, periodo, destinatario). |
| `proyecto` | Sí, salvo que exista `pie` | Se usa en el pie: `Tipo · Proyecto · vX`. |
| `version` | Sí | Versión del documento (`'1.0'`). |
| `campos` | Sí | Tabla de la portada: arreglo de `[campo, valor]`. Ningún valor puede ir vacío: si falta un dato, preguntarlo o quitar la fila. |
| `proposito` | No | Cadena o `{ titulo, texto }`. Bloque "Propósito de este documento" en la portada. |
| `pie` | No | Sobrescribe el texto del pie de página. |
| `indice` | No (`true`) | `false` omite la página de índice (minutas y documentos de 1–3 páginas). |
| `numerarSecciones` | No (`true`) | `false` quita la numeración de H1/H2. |
| `cierre` | No (`true`) | `false` omite la línea "Fin del documento". |
| `demo` | No | `true` agrega el aviso ámbar de datos ficticios en la portada. Solo para ejemplos. |

El cliente se nombra siempre por su **nombre comercial**, no por su razón social.

## 2. `secciones`

Arreglo de objetos. Cada sección es un H1 (aparece en el índice).

| Campo | Uso |
|---|---|
| `titulo` | Obligatorio. Texto del H1 (el número se agrega solo: `3.  Título`). |
| `intro` | Párrafo opcional inmediatamente después del H1. |
| `bloques` | Arreglo de bloques (abajo). |
| `nuevaPagina` | `true` por defecto: la sección empieza en página nueva. `false` la continúa tras un espacio. Usar `false` en secciones cortas consecutivas. |
| `numerada` | `false` para una sección sin número (p. ej. Anexos) que no consume numeración. |

## 3. Bloques

Todos llevan `tipo`. Entre paréntesis, el equivalente visual en control-cambios.

| `tipo` | Campos | Resultado |
|---|---|---|
| `parrafo` | `texto`, `alineacion?` (`izquierda`/`centro`/`derecha`/`justificado`), `estilo?` (`'secundario'`) | Párrafo justificado Lexend 10 pt gris. `secundario` = 9 pt cursiva, para la línea que explica una tabla. |
| `subtitulo` | `texto` | H2 verde numerado `n.m` (aparece en el índice). |
| `h3` | `texto` | Encabezado negro en negrita, sin numerar, fuera del índice. |
| `barra` | `texto` | Barra negra con texto blanco (sub-encabezado de bloque, el recurso más usado en los documentos Bambú). |
| `vinetas` | `items`: cadenas u objetos `{ texto, items }` (2 niveles) | Viñetas ▪ verdes; segundo nivel con guion. |
| `numerada` | `items` (igual que viñetas) | Lista numerada en verde; cada bloque reinicia en 1. |
| `tabla` | `encabezados`, `filas`, `anchos?` (relativos), `alinear?` (`{indiceColumna: 'centro'|'derecha'}`), `total?` (última fila resaltada en verde claro), `tamano?` (`normal`/`compacta`/`mini`), `primeraNegrita?` (`true` por defecto), `descripcion?`, `juntar?` (por defecto `true` si tiene 10 filas o menos: la tabla no se parte entre páginas) | Tabla con borde verde, encabezado negro, filas alternas. El tamaño de letra se ajusta solo según el número de columnas si no se indica. `\n` dentro de una celda crea un salto de línea. |
| `atributos` | `filas` de `[atributo, detalle]`, `encabezados?`, `anchos?` | Tabla de dos columnas Atributo/Detalle (ficha de un elemento). |
| `nota` | `texto`, `titulo?`, `variante?` (`info` por defecto o `alerta`) | Recuadro con filete izquierdo: verde (info) o ámbar (alerta). |
| `codigo` | `texto` (multilínea) | Bloque monoespaciado con fondo gris claro y filete verde. Para comandos, rutas, configuraciones. |
| `imagen` | `ruta`, `ancho?` (px, máx. ≈ 627), `pie?` | Imagen centrada que conserva su proporción (PNG o JPEG). |
| `firmas` | `firmantes` `[{ nombre, cargo?, organizacion? }]`, `conFecha?` | Bloque de firmas, dos por renglón, con línea de firma. |
| `espacio` | `alto?` (twips, 200 por defecto) | Espacio vertical. |
| `saltoPagina` | — | Salto de página manual. |

### Anchos de columna recomendados
- 2 columnas ID + texto: `[12, 88]`
- Campo/valor: `[28, 72]`
- 4 columnas con texto largo en la segunda: `[10, 50, 20, 20]`
- 6 o más columnas: usar `tamano: 'mini'` y textos cortos; el matiz va en un párrafo aparte.

Un identificador partido en dos líneas es la falla visual más común: si ocurre, ampliar la columna del ID.

## 4. Formato en línea

Disponible en `parrafo`, `nota`, listas y celdas de tabla:

- `**negrita**`
- `*cursiva*`
- `` `código` `` (monoespaciado)

## 5. Convenciones de identificadores

Usar identificadores cuando el documento enumere elementos que se van a referenciar después (acuerdos, pendientes, hallazgos, riesgos). Prefijos habituales en Bambú:

| Prefijo | Uso |
|---|---|
| `A-nn` | Acuerdo |
| `P-nn` | Pendiente o punto abierto |
| `H-nn` | Hallazgo |
| `R-nn` | Recomendación |
| `RG-nn` | Riesgo |
| `RN-‹MOD›-nn` | Regla de negocio |
| `CAM-‹MOD›-nn` | Cambio (propio de control-cambios) |

Numeración con dos dígitos (`01`) y única dentro del documento.
