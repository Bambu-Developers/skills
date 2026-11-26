# bambu-documentos

Skill de Claude Code que genera **documentos Word (`.docx`) editables** con la identidad visual
de Bambú Tech Services: portada, encabezado con logos, pie con barra verde y numeración,
índice, tablas, listas, notas y firmas. El trabajo de cada documento es el contenido; el
formato lo resuelve el motor.

## Estructura

```
bambu-documentos/
├── SKILL.md                 # flujo: elegir plantilla → datos → redactar → generar → verificar
├── references/              # data-schema.md (esquema y 14 bloques) · plantillas.md (guía por tipo)
├── templates/               # minuta.js · informe.js · propuesta.js · manual.js
├── scripts/build_doc.js     # motor: valida los datos y escribe el .docx
└── assets/                  # logos, barra de pie y tipografías Lexend / Noto Sans
```

## Requisitos

- Node.js y el paquete `docx`: `npm install -g docx` (se ejecuta con `NODE_PATH="$(npm root -g)"`).
- Opcional, para verificación visual: LibreOffice (`soffice`) y poppler (`pdftoppm`).

## Uso

Se activa al pedir una minuta, informe, propuesta técnica, manual o un documento Word con
formato Bambú. Para ejecutar el motor a mano:

```bash
NODE_PATH="$(npm root -g)" node scripts/build_doc.js datos.js Minuta_Proyecto_2026-01-01.docx
```

No inventa datos de portada (fechas, montos, participantes, firmantes): los pregunta o deja
"Por definir".
