// ══════════════════════════════════════════════════════════════════════════
// Plantilla — INFORME (técnico, de avance, de diagnóstico o ejecutivo)
// Copiar a un archivo temporal (datos.js), reemplazar todo lo que esté entre ‹ › y
// ejecutar:  node <skill>/scripts/build_doc.js datos.js <salida.docx>
// Guía de contenido: references/plantillas.md § Informe
// ══════════════════════════════════════════════════════════════════════════
module.exports = {
  meta: {
    tipo: 'Informe',            // o 'Informe técnico', 'Informe de avance', 'Informe de diagnóstico'
    titulo: '‹Tema del informe›',
    subtitulo: '‹Periodo o alcance: p. ej. Corte al 30 de septiembre de 2026›',
    proyecto: '‹Proyecto›',
    version: '1.0',
    campos: [
      ['Proyecto', '‹Proyecto›'],
      ['Cliente', '‹Nombre comercial del cliente›'],
      ['Fecha', '‹7 de octubre de 2026›'],
      ['Elaborado por', 'Bambú Tech Services'],
      ['Versión del documento', '1.0'],
      ['Clasificación', '‹Interno / Confidencial — Cliente›'],
    ],
    proposito: '‹Qué decisión o lectura habilita este informe y para quién.›',
  },
  secciones: [
    {
      titulo: 'Resumen ejecutivo',
      bloques: [
        // 2–4 párrafos que se sostienen solos: conclusión primero, luego el porqué.
        { tipo: 'parrafo', texto: '‹Conclusión principal en una o dos frases.›' },
        { tipo: 'barra', texto: 'Puntos clave' },
        { tipo: 'vinetas', items: ['‹Hallazgo o cifra clave›', '‹Riesgo principal›', '‹Recomendación principal›'] },
      ],
    },
    {
      titulo: 'Antecedentes y alcance',
      bloques: [
        { tipo: 'parrafo', texto: '‹Contexto necesario para leer el informe.›' },
        { tipo: 'barra', texto: 'Alcance' },
        { tipo: 'parrafo', texto: '‹Qué cubre y qué no cubre.›' },
      ],
    },
    {
      titulo: 'Hallazgos',
      bloques: [
        { tipo: 'tabla', encabezados: ['ID', 'Hallazgo', 'Severidad', 'Área'],
          anchos: [10, 56, 14, 20], alinear: { 2: 'centro' },
          filas: [['H-01', '‹Descripción del hallazgo›', '‹Alta›', '‹Módulo›']] },
        { tipo: 'subtitulo', texto: '‹H-01 · Título del hallazgo›' },
        { tipo: 'parrafo', texto: '‹Detalle, evidencia y consecuencia.›' },
      ],
    },
    {
      titulo: 'Recomendaciones',
      bloques: [
        { tipo: 'tabla', encabezados: ['ID', 'Recomendación', 'Prioridad', 'Atiende'],
          anchos: [10, 60, 14, 16], alinear: { 2: 'centro' },
          filas: [['R-01', '‹Acción recomendada›', '‹Alta›', 'H-01']] },
      ],
    },
    {
      titulo: 'Conclusión',
      bloques: [ { tipo: 'parrafo', texto: '‹Cierre: qué se recomienda decidir y cuándo.›' } ],
    },
  ],
};
