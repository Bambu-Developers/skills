// ══════════════════════════════════════════════════════════════════════════
// Plantilla — MANUAL (de usuario, de operación, de instalación o técnico)
// Copiar a un archivo temporal (datos.js), reemplazar todo lo que esté entre ‹ › y
// ejecutar:  node <skill>/scripts/build_doc.js datos.js <salida.docx>
// Guía de contenido: references/plantillas.md § Manual
// ══════════════════════════════════════════════════════════════════════════
module.exports = {
  meta: {
    tipo: 'Manual de usuario',  // o 'Manual de operación', 'Manual de instalación', 'Manual técnico'
    titulo: '‹Sistema o módulo›',
    subtitulo: '‹A quién va dirigido: p. ej. Operadores de taquilla›',
    proyecto: '‹Proyecto›',
    version: '1.0',
    campos: [
      ['Sistema', '‹Sistema›'],
      ['Módulo', '‹Módulo›'],
      ['Cliente', '‹Nombre comercial del cliente›'],
      ['Versión del sistema', '‹x.y.z›'],
      ['Fecha', '‹7 de octubre de 2026›'],
      ['Elaborado por', 'Bambú Tech Services'],
      ['Versión del documento', '1.0'],
    ],
    proposito: '‹Qué podrá hacer el lector al terminar de leer este manual.›',
  },
  secciones: [
    {
      titulo: 'Introducción',
      bloques: [
        { tipo: 'parrafo', texto: '‹Qué es el sistema o módulo y para qué sirve.›' },
        { tipo: 'barra', texto: 'A quién va dirigido' },
        { tipo: 'parrafo', texto: '‹Perfil del lector y conocimientos previos.›' },
      ],
    },
    {
      titulo: 'Requisitos previos',
      nuevaPagina: false,
      bloques: [
        { tipo: 'vinetas', items: ['‹Acceso, permisos, equipo, software o datos necesarios›'] },
      ],
    },
    {
      titulo: 'Conceptos clave',
      nuevaPagina: false,
      bloques: [
        { tipo: 'tabla', encabezados: ['Concepto', 'Descripción'], anchos: [26, 74],
          filas: [['‹Término›', '‹Definición en lenguaje del usuario›']] },
      ],
    },
    {
      titulo: 'Procedimientos',
      bloques: [
        // Un subtítulo por tarea. Pasos numerados en imperativo, una acción por paso.
        { tipo: 'subtitulo', texto: '‹Nombre de la tarea›' },
        { tipo: 'parrafo', texto: '‹Cuándo se realiza esta tarea.›' },
        { tipo: 'numerada', items: ['‹Abra …›', '‹Seleccione …›', '‹Presione **Guardar**.›'] },
        { tipo: 'nota', titulo: 'Importante:', texto: '‹Advertencia o resultado esperado.›', variante: 'alerta' },
      ],
    },
    {
      titulo: 'Solución de problemas',
      bloques: [
        { tipo: 'tabla', encabezados: ['Síntoma', 'Causa probable', 'Qué hacer'], anchos: [30, 30, 40],
          filas: [['‹Mensaje o comportamiento›', '‹Causa›', '‹Acción›']] },
      ],
    },
    {
      titulo: 'Historial de versiones',
      nuevaPagina: false,
      bloques: [
        { tipo: 'tabla', encabezados: ['Versión', 'Fecha', 'Descripción del cambio'], anchos: [14, 20, 66],
          alinear: { 0: 'centro', 1: 'centro' },
          filas: [['1.0', '‹dd/mm/aaaa›', 'Emisión inicial']] },
      ],
    },
  ],
};
