// ══════════════════════════════════════════════════════════════════════════
// Plantilla — MINUTA DE REUNIÓN (Bambú Tech Services)
// Copiar a un archivo temporal (datos.js), reemplazar todo lo que esté entre ‹ › y
// ejecutar:  node <skill>/scripts/build_doc.js datos.js <salida.docx>
// Guía de contenido: references/plantillas.md § Minuta
// ══════════════════════════════════════════════════════════════════════════
module.exports = {
  meta: {
    tipo: 'Minuta de reunión',
    titulo: '‹Nombre corto de la sesión›',               // p. ej. 'Seguimiento semanal — Módulo de Tarifas'
    subtitulo: '‹Título de la convocatoria tal como se citó›',
    proyecto: '‹Proyecto›',
    version: '1.0',
    campos: [
      ['Proyecto', '‹Proyecto›'],
      ['Cliente', '‹Nombre comercial del cliente›'],
      ['Fecha de la sesión', '‹7 de octubre de 2026›'],
      ['Modalidad', '‹Presencial / Videollamada›'],
      ['Elaborado por', 'Bambú Tech Services'],
      ['Versión del documento', '1.0'],
    ],
    proposito: '‹Para qué sirve esta minuta: dejar constancia de los acuerdos, dar seguimiento a pendientes, etc.›',
    indice: false,              // una minuta corta no necesita índice
  },
  secciones: [
    {
      titulo: 'Datos de la sesión',
      bloques: [
        { tipo: 'barra', texto: 'Participantes' },
        { tipo: 'tabla', encabezados: ['Participante', 'Organización'], anchos: [45, 55],
          filas: [
            ['‹Nombre›', '‹Cliente›'],
            ['‹Nombre›', 'Bambú Tech Services'],
          ] },
        { tipo: 'barra', texto: 'Agenda' },
        { tipo: 'numerada', items: ['‹Tema 1›', '‹Tema 2›'] },
      ],
    },
    {
      titulo: 'Desarrollo de la sesión',
      nuevaPagina: false,
      bloques: [
        // Un subtítulo por tema de la agenda. Prosa profesional: qué se planteó,
        // qué se concluyó. Sin transcribir el diálogo.
        { tipo: 'subtitulo', texto: '‹Tema 1›' },
        { tipo: 'parrafo', texto: '‹Qué se planteó y a qué conclusión se llegó.›' },
      ],
    },
    {
      titulo: 'Acuerdos',
      bloques: [
        { tipo: 'tabla', encabezados: ['ID', 'Acuerdo'], anchos: [12, 88],
          filas: [['A-01', '‹Acuerdo redactado como compromiso verificable›']] },
      ],
    },
    {
      titulo: 'Pendientes y responsables',
      nuevaPagina: false,
      bloques: [
        { tipo: 'tabla', encabezados: ['ID', 'Acción', 'Responsable', 'Fecha compromiso'],
          anchos: [10, 48, 22, 20], alinear: { 3: 'centro' },
          filas: [['P-01', '‹Acción concreta›', '‹Nombre (Organización)›', '‹dd/mm/aaaa›']] },
      ],
    },
    {
      titulo: 'Próxima sesión',
      nuevaPagina: false,
      bloques: [
        { tipo: 'atributos', filas: [['Fecha tentativa', '‹…›'], ['Temas a tratar', '‹…›']] },
      ],
    },
    // Opcional, solo si el usuario lo pide:
    // { titulo: 'Firmas de conformidad', bloques: [
    //   { tipo: 'firmas', conFecha: true, firmantes: [
    //     { nombre: '‹Nombre›', organizacion: '‹Cliente›' },
    //     { nombre: '‹Nombre›', organizacion: 'Bambú Tech Services' } ] } ] },
  ],
};
