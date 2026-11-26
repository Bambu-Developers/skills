// ══════════════════════════════════════════════════════════════════════════
// Plantilla — PROPUESTA (técnica o de servicio)
// Para cotizaciones con precio calculado desde una matriz de casos de uso,
// usar la skill bambu-cotizador. Esta plantilla cubre propuestas técnicas,
// de solución o de servicio donde la inversión ya la define el usuario.
// Copiar a un archivo temporal (datos.js), reemplazar todo lo que esté entre ‹ › y
// ejecutar:  node <skill>/scripts/build_doc.js datos.js <salida.docx>
// Guía de contenido: references/plantillas.md § Propuesta
// ══════════════════════════════════════════════════════════════════════════
module.exports = {
  meta: {
    tipo: 'Propuesta técnica',  // o 'Propuesta de servicio', 'Propuesta de solución'
    titulo: '‹Nombre de la solución o servicio›',
    subtitulo: 'Preparada para ‹Nombre comercial del cliente›',
    proyecto: '‹Proyecto o cuenta›',
    version: '1.0',
    campos: [
      ['Cliente', '‹Nombre comercial del cliente›'],
      ['Proyecto', '‹Proyecto›'],
      ['Fecha', '‹7 de octubre de 2026›'],
      ['Vigencia de la propuesta', '‹30 días naturales›'],
      ['Elaborado por', 'Bambú Tech Services'],
      ['Versión del documento', '1.0'],
    ],
    proposito: '‹Qué resuelve la propuesta y qué se le pide decidir al cliente.›',
  },
  secciones: [
    {
      titulo: 'Resumen de la propuesta',
      bloques: [
        { tipo: 'parrafo', texto: '‹Necesidad del cliente, solución propuesta y resultado esperado, en un párrafo.›' },
        { tipo: 'atributos', encabezados: ['Concepto', 'Detalle'], filas: [
          ['Duración estimada', '‹12 semanas›'],
          ['Modalidad', '‹Proyecto cerrado / Bolsa de horas / Servicio mensual›'],
          ['Inversión', '‹Monto + moneda + IVA›'],
        ] },
      ],
    },
    {
      titulo: 'Entendimiento de la necesidad',
      bloques: [
        { tipo: 'parrafo', texto: '‹Situación actual del cliente, problema y objetivos de negocio, en sus términos.›' },
      ],
    },
    {
      titulo: 'Solución propuesta',
      bloques: [
        { tipo: 'subtitulo', texto: 'Alcance' },
        { tipo: 'vinetas', items: ['‹Componente o funcionalidad incluida›'] },
        { tipo: 'subtitulo', texto: 'Fuera de alcance' },
        { tipo: 'vinetas', items: ['‹Exclusión explícita›'] },
        { tipo: 'subtitulo', texto: 'Entregables' },
        { tipo: 'tabla', encabezados: ['Entregable', 'Descripción', 'Momento de entrega'],
          anchos: [28, 50, 22], filas: [['‹Entregable›', '‹Qué es›', '‹Semana 4›']] },
      ],
    },
    {
      titulo: 'Plan de trabajo',
      bloques: [
        { tipo: 'tabla', encabezados: ['Fase', 'Actividades principales', 'Duración'],
          anchos: [22, 60, 18], alinear: { 2: 'centro' },
          filas: [['‹Fase 1›', '‹Actividades›', '‹2 semanas›']] },
      ],
    },
    {
      titulo: 'Inversión y condiciones',
      bloques: [
        { tipo: 'tabla', encabezados: ['Concepto', 'Importe'], anchos: [70, 30], total: true,
          alinear: { 1: 'derecha' },
          filas: [['‹Concepto›', '‹$0.00›'], ['Total antes de IVA', '‹$0.00›']] },
        { tipo: 'barra', texto: 'Condiciones comerciales' },
        { tipo: 'vinetas', items: ['‹Forma de pago›', '‹Vigencia›'] },
        { tipo: 'barra', texto: 'Supuestos' },
        { tipo: 'vinetas', items: ['‹Supuesto sobre el que descansa la estimación›'] },
      ],
    },
    {
      titulo: 'Aceptación',
      bloques: [
        { tipo: 'parrafo', texto: 'La firma de este documento formaliza la aceptación de la propuesta en los términos aquí descritos.' },
        { tipo: 'firmas', conFecha: true, firmantes: [
          { nombre: '‹Nombre›', cargo: '‹Cargo›', organizacion: '‹Cliente›' },
          { nombre: '‹Nombre›', cargo: '‹Cargo›', organizacion: 'Bambú Tech Services' },
        ] },
      ],
    },
  ],
};
