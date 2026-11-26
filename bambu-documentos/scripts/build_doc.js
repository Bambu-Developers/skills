// ══════════════════════════════════════════════════════════════════════════
// Generador genérico de documentos — Identidad visual Bambú Tech Services
// Uso:  node build_doc.js <datos.js> <salida.docx>
// El archivo de datos exporta { meta, secciones }. Esquema completo en
// references/data-schema.md. La identidad (tipografías, paleta, encabezado,
// pie, portada, tablas) es la misma del Reporte de Cambios Solicitados.
// ══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const D = require('docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, HeadingLevel, PageBreak, BorderStyle, ImageRun,
  Header, Footer, PageNumber, TableOfContents, HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom, TextWrappingType, LevelFormat, VerticalAlign,
} = D;

const DATA_PATH = process.argv[2];
const OUT_PATH  = process.argv[3];
if (!DATA_PATH || !OUT_PATH) {
  console.error('Uso: node build_doc.js <datos.js> <salida.docx>');
  process.exit(1);
}
const DATA = require(path.resolve(DATA_PATH));
const META = DATA.meta || {};
const SECS = DATA.secciones || [];

// ─── Identidad Bambú ───────────────────────────────────────────────────────
const VERDE='52D93E', GRIS='4D4D4D', NEGRO='000000', BLANCO='FFFFFF',
      GRISCL='F5F5F5', BORDE='E0E0E0', VERDECL='E8F7E4',
      AMBAR='E0A800', AMBARCL='FFF4CC', AMBARTX='7A5C00';
const FL='Lexend', FN='Noto Sans', FC='Consolas';
const PW=11906, PH=16838, ML=1250, MR=1250, MT=2100, MB=1750;
const CW = PW-ML-MR;               // ancho útil en DXA
const CW_PX = Math.floor(CW/15);   // ≈ ancho útil en px a 96 dpi

const A = (() => {
  const c = [path.resolve(__dirname, '../assets')];
  const hit = c.find(d => fs.existsSync(path.join(d, 'header-logo-left.png')));
  if (!hit) { console.error('ERROR: no se encontraron los assets de marca en:\n  ' + c.join('\n  ')); process.exit(1); }
  return hit;
})();
const img = f => fs.readFileSync(path.join(A, f));

// ─── Validación de entrada ─────────────────────────────────────────────────
const TIPOS = ['parrafo','subtitulo','h3','barra','vinetas','numerada','tabla',
  'atributos','nota','codigo','imagen','firmas','espacio','saltoPagina'];
(() => {
  const errs = [];
  ['tipo','titulo','version'].forEach(k => { if (!META[k]) errs.push(`meta.${k} está vacío`); });
  if (!META.pie && !META.proyecto) errs.push('meta.proyecto está vacío (o define meta.pie para el pie de página)');
  if (!Array.isArray(META.campos) || !META.campos.length) errs.push('meta.campos debe tener al menos un par [campo, valor] para la portada');
  (META.campos||[]).forEach((f,i) => {
    if (!Array.isArray(f) || f.length!==2) errs.push(`meta.campos[${i}] debe ser [campo, valor]`);
    else if (f[1]===undefined || f[1]===null || String(f[1]).trim()==='') errs.push(`meta.campos[${i}] ("${f[0]}") no tiene valor — pregúntalo al usuario o quita la fila`);
  });
  if (!SECS.length) errs.push('no hay secciones');
  SECS.forEach((s,si) => {
    if (!s.titulo) errs.push(`secciones[${si}].titulo está vacío`);
    (s.bloques||[]).forEach((b,bi) => {
      const at = `secciones[${si}] ("${s.titulo}") bloques[${bi}]`;
      if (!TIPOS.includes(b.tipo)) { errs.push(`${at}: tipo "${b.tipo}" desconocido. Permitidos: ${TIPOS.join(', ')}`); return; }
      if (['parrafo','subtitulo','h3','barra','nota','codigo'].includes(b.tipo) && !b.texto) errs.push(`${at} (${b.tipo}): falta texto`);
      if (['vinetas','numerada'].includes(b.tipo) && !(b.items||[]).length) errs.push(`${at} (${b.tipo}): items vacío`);
      if (b.tipo==='tabla') {
        const n = (b.encabezados||[]).length;
        if (!n) errs.push(`${at} (tabla): faltan encabezados`);
        if (!(b.filas||[]).length) errs.push(`${at} (tabla): filas vacío`);
        (b.filas||[]).forEach((r,ri) => { if (r.length!==n) errs.push(`${at} (tabla): la fila ${ri} tiene ${r.length} celdas y hay ${n} encabezados`); });
        if (b.anchos && b.anchos.length!==n) errs.push(`${at} (tabla): anchos tiene ${b.anchos.length} valores y hay ${n} columnas`);
      }
      if (b.tipo==='atributos') (b.filas||[]).forEach((r,ri) => { if (r.length!==2) errs.push(`${at} (atributos): la fila ${ri} debe ser [atributo, detalle]`); });
      if (b.tipo==='imagen' && !(b.ruta && fs.existsSync(b.ruta))) errs.push(`${at} (imagen): no existe la ruta "${b.ruta}"`);
      if (b.tipo==='firmas' && !(b.firmantes||[]).length) errs.push(`${at} (firmas): firmantes vacío`);
    });
  });
  if (errs.length) { console.error('Datos inválidos:\n - ' + errs.join('\n - ')); process.exit(1); }
})();

// ─── Texto enriquecido en línea: **negrita**, *cursiva*, `código` ─────────
function runs(text, base={}) {
  const out = [];
  String(text).split(/(\*\*[^*]+?\*\*|\*[^*\s][^*]*?\*|`[^`]+`)/g).forEach(tok => {
    if (!tok) return;
    let t = tok, b = !!base.bold, it = !!base.italics, font = base.font||FL, size = base.size||20;
    if (/^\*\*.+\*\*$/.test(tok)) { t = tok.slice(2,-2); b = true; }
    else if (/^\*.+\*$/.test(tok)) { t = tok.slice(1,-1); it = true; }
    else if (/^`.+`$/.test(tok)) { t = tok.slice(1,-1); font = FC; size = Math.max(size-2,14); }
    out.push(new TextRun({text:t, font, size, bold:b, italics:it, color:base.color||GRIS}));
  });
  return out;
}
const ALIGN = { izquierda:AlignmentType.LEFT, centro:AlignmentType.CENTER,
  derecha:AlignmentType.RIGHT, justificado:AlignmentType.JUSTIFIED };

// ─── Componentes base (idénticos a control-cambios) ───────────────────────
const P = (text,o={}) => new Paragraph({
  alignment:o.align||AlignmentType.JUSTIFIED,
  spacing:{before:o.before??40,after:o.after??100,line:o.line??280},
  children:runs(text,{font:o.font,size:o.size,color:o.color,bold:o.bold,italics:o.italics}),
});
const H1 = t => new Paragraph({
  heading:HeadingLevel.HEADING_1, spacing:{before:280,after:140}, keepNext:true,
  border:{bottom:{style:BorderStyle.SINGLE,size:8,color:VERDE,space:4}},
  children:[new TextRun({text:t,font:FL,size:30,bold:true,color:VERDE})],
});
const H2 = t => new Paragraph({
  heading:HeadingLevel.HEADING_2, spacing:{before:240,after:100}, keepNext:true,
  children:[new TextRun({text:t,font:FL,size:26,bold:true,color:VERDE})],
});
const H3 = t => new Paragraph({
  spacing:{before:180,after:80}, keepNext:true,
  children:[new TextRun({text:t,font:FL,size:21,bold:true,color:NEGRO})],
});
const BAR = t => new Paragraph({
  spacing:{before:160,after:60}, keepNext:true,
  shading:{type:ShadingType.CLEAR,fill:NEGRO,color:'auto'},
  indent:{left:80,right:80},
  children:[new TextRun({text:t,font:FL,size:20,bold:true,color:BLANCO})],
});
const SP = h => new Paragraph({spacing:{before:0,after:h},children:[new TextRun('')]});
const PB = () => new Paragraph({children:[new PageBreak()]});

function TBL(headers, rows, widths, opts={}) {
  widths = widths || headers.map(()=>1);
  const total = widths.reduce((a,b)=>a+b,0);
  const cols = widths.map(w=>Math.round(w/total*CW));
  cols[cols.length-1] += CW - cols.reduce((a,b)=>a+b,0);
  const size = opts.size || (headers.length>=6?15:headers.length>=4?16:17);
  const last = rows.length-1;
  // Tablas cortas no se parten entre páginas (keepNext en todas las filas menos la última)
  const keep = opts.keep ?? rows.length <= 10;
  const cell = (txt,i,isHead,ri) => {
    const isTotal = opts.totalRow && !isHead && ri===last;
    return new TableCell({
      width:{size:cols[i],type:WidthType.DXA},
      shading:{type:ShadingType.CLEAR,color:'auto',
        fill:isHead?NEGRO:(isTotal?VERDECL:(ri%2===1?GRISCL:BLANCO))},
      margins:{top:60,bottom:60,left:90,right:90},
      verticalAlign:VerticalAlign.CENTER,
      children:String(txt??'').split('\n').map(line=>new Paragraph({
        alignment:isHead?AlignmentType.CENTER:(opts.align?.[i]||AlignmentType.LEFT),
        spacing:{before:10,after:10,line:240},
        keepNext: keep && (isHead || ri<last),
        children:runs(line,{font:FN,size,color:isHead?BLANCO:GRIS,
          bold:isHead||isTotal||(opts.boldFirst&&i===0)}),
      })),
    });
  };
  return new Table({
    width:{size:CW,type:WidthType.DXA}, columnWidths:cols,
    borders:{
      top:{style:BorderStyle.SINGLE,size:8,color:VERDE},
      bottom:{style:BorderStyle.SINGLE,size:8,color:VERDE},
      left:{style:BorderStyle.SINGLE,size:8,color:VERDE},
      right:{style:BorderStyle.SINGLE,size:8,color:VERDE},
      insideHorizontal:{style:BorderStyle.SINGLE,size:3,color:BORDE},
      insideVertical:{style:BorderStyle.SINGLE,size:3,color:BORDE},
    },
    rows:[
      new TableRow({tableHeader:true,cantSplit:true,children:headers.map((h,i)=>cell(h,i,true,0))}),
      ...rows.map((r,ri)=>new TableRow({cantSplit:true,children:r.map((c,i)=>cell(c,i,false,ri))})),
    ],
  });
}

// ─── Listas: viñetas ▪ verdes (2 niveles) y numeradas que reinician ───────
let numInstance = 0;
function listItems(items, kind, level=0, inst=0, out=[]) {
  items.forEach(it => {
    const texto = typeof it==='string' ? it : it.texto;
    out.push(new Paragraph({
      numbering: kind==='num' ? {reference:'bambu-num',level,instance:inst}
                              : {reference:'bambu-bullets',level},
      spacing:{before:30,after:60,line:280}, alignment:AlignmentType.JUSTIFIED,
      children:runs(texto),
    }));
    if (it && it.items && level<1) listItems(it.items, kind, level+1, inst, out);
  });
  return out;
}

// ─── Imagen: dimensiones reales de PNG/JPEG para conservar proporción ─────
function imgDims(buf) {
  if (buf.readUInt32BE(0)===0x89504E47) return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20),type:'png'};
  if (buf[0]===0xFF && buf[1]===0xD8) {
    let i=2;
    while (i<buf.length) {
      if (buf[i]!==0xFF) { i++; continue; }
      const m=buf[i+1], len=buf.readUInt16BE(i+2);
      if (m>=0xC0 && m<=0xCF && ![0xC4,0xC8,0xCC].includes(m))
        return {h:buf.readUInt16BE(i+5),w:buf.readUInt16BE(i+7),type:'jpg'};
      i+=2+len;
    }
  }
  return null;
}

// ─── Bloque de firmas: dos por renglón, sin bordes ────────────────────────
function FIRMAS(firmantes, conFecha) {
  const NB = {style:BorderStyle.NONE,size:0,color:'FFFFFF'};
  const half = Math.floor(CW/2);
  const cellFor = f => new TableCell({
    width:{size:half,type:WidthType.DXA},
    borders:{top:NB,bottom:NB,left:NB,right:NB},
    margins:{left:240,right:240},
    children: f ? [
      SP(900),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:40},
        border:{top:{style:BorderStyle.SINGLE,size:6,color:NEGRO,space:6}},
        children:[new TextRun({text:f.nombre,font:FL,size:19,bold:true,color:NEGRO})]}),
      ...(f.cargo?[new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:20},
        children:[new TextRun({text:f.cargo,font:FN,size:16,color:GRIS})]})]:[]),
      ...(f.organizacion?[new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:20},
        children:[new TextRun({text:f.organizacion,font:FN,size:16,bold:true,color:GRIS})]})]:[]),
      ...(conFecha?[new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60,after:0},
        children:[new TextRun({text:'Fecha: ____________________',font:FN,size:16,color:GRIS})]})]:[]),
    ] : [SP(0)],
  });
  const rows = [];
  for (let i=0;i<firmantes.length;i+=2)
    rows.push(new TableRow({cantSplit:true,children:[cellFor(firmantes[i]),cellFor(firmantes[i+1])]}));
  return new Table({width:{size:half*2,type:WidthType.DXA},columnWidths:[half,half],
    borders:{top:NB,bottom:NB,left:NB,right:NB,insideHorizontal:NB,insideVertical:NB},rows});
}

// ─── Render de bloques ─────────────────────────────────────────────────────
const NUMERAR = META.numerarSecciones !== false;
function renderBloque(b, ctx, out) {
  switch (b.tipo) {
    case 'parrafo':
      if (b.estilo==='secundario') out.push(P(b.texto,{size:18,italics:true,after:80,align:ALIGN[b.alineacion]}));
      else out.push(P(b.texto,{align:ALIGN[b.alineacion]}));
      break;
    case 'subtitulo':
      ctx.h2++;
      out.push(H2(NUMERAR && ctx.num ? `${ctx.num}.${ctx.h2}  ${b.texto}` : b.texto));
      break;
    case 'h3': out.push(H3(b.texto)); break;
    case 'barra': out.push(BAR(b.texto)); break;
    case 'vinetas': listItems(b.items,'bul',0,0,out); break;
    case 'numerada': listItems(b.items,'num',0,++numInstance,out); break;
    case 'tabla': {
      if (b.descripcion) out.push(new Paragraph({keepNext:true,spacing:{before:40,after:80,line:280},
        children:runs(b.descripcion,{size:18,italics:true})}));
      const al = {};
      Object.entries(b.alinear||{}).forEach(([k,v])=>{ al[k]=ALIGN[v]; });
      const sz = {normal:17,compacta:16,mini:15}[b.tamano];
      out.push(TBL(b.encabezados,b.filas,b.anchos,{size:sz,align:al,keep:b.juntar,
        totalRow:!!b.total,boldFirst:b.primeraNegrita!==false}));
      out.push(SP(120));
      break;
    }
    case 'atributos':
      out.push(TBL(b.encabezados||['Atributo','Detalle'],b.filas,b.anchos||[28,72],{boldFirst:true,size:16}));
      out.push(SP(120));
      break;
    case 'nota': {
      const al = b.variante==='alerta';
      out.push(new Paragraph({
        spacing:{before:120,after:140,line:280}, alignment:AlignmentType.JUSTIFIED,
        shading:{type:ShadingType.CLEAR,fill:al?AMBARCL:VERDECL,color:'auto'},
        border:{left:{style:BorderStyle.SINGLE,size:24,color:al?AMBAR:VERDE,space:8}},
        indent:{left:160,right:120},
        children:[...(b.titulo?[new TextRun({text:b.titulo+'  ',font:FL,size:19,bold:true,color:al?AMBARTX:NEGRO})]:[]),
          ...runs(b.texto,{size:19,color:al?AMBARTX:GRIS})],
      }));
      break;
    }
    case 'codigo':
      String(b.texto).split('\n').forEach((line,i,arr)=>out.push(new Paragraph({
        spacing:{before:i===0?80:0,after:i===arr.length-1?120:0,line:250},
        shading:{type:ShadingType.CLEAR,fill:GRISCL,color:'auto'},
        border:{left:{style:BorderStyle.SINGLE,size:12,color:VERDE,space:8}},
        indent:{left:160,right:120},
        children:[new TextRun({text:line||' ',font:FC,size:17,color:NEGRO})],
      })));
      break;
    case 'imagen': {
      const buf = fs.readFileSync(b.ruta);
      const d = imgDims(buf) || {w:b.ancho||CW_PX,h:b.alto||Math.round((b.ancho||CW_PX)*0.6),type:path.extname(b.ruta).slice(1).replace('jpeg','jpg')};
      const w = Math.min(b.ancho || d.w, CW_PX);
      const h = Math.round(w * d.h / d.w);
      out.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:120,after:b.pie?40:140},keepNext:!!b.pie,
        children:[new ImageRun({type:d.type,data:buf,transformation:{width:w,height:h}})]}));
      if (b.pie) out.push(P(b.pie,{size:16,italics:true,align:AlignmentType.CENTER,after:160}));
      break;
    }
    case 'firmas': out.push(FIRMAS(b.firmantes,!!b.conFecha)); out.push(SP(120)); break;
    case 'espacio': out.push(SP(b.alto||200)); break;
    case 'saltoPagina': out.push(PB()); break;
  }
}

// ─── Encabezado y pie ──────────────────────────────────────────────────────
const CM = 360000;
const headerLogos = new Paragraph({spacing:{before:0,after:0},children:[
  new ImageRun({type:'png',data:img('header-logo-left.png'),
    transformation:{width:143,height:53},
    floating:{horizontalPosition:{relative:HorizontalPositionRelativeFrom.PAGE,offset:Math.round(1.5*CM)},
      verticalPosition:{relative:VerticalPositionRelativeFrom.PAGE,offset:Math.round(0.75*CM)},
      wrap:{type:TextWrappingType.NONE},behindDocument:true}}),
  new ImageRun({type:'png',data:img('header-logo-right.png'),
    transformation:{width:179,height:130},
    floating:{horizontalPosition:{relative:HorizontalPositionRelativeFrom.PAGE,offset:Math.round(15.9*CM)},
      verticalPosition:{relative:VerticalPositionRelativeFrom.PAGE,offset:0},
      wrap:{type:TextWrappingType.NONE},behindDocument:true}}),
]});
const tipoTitulo = String(META.tipo).toLowerCase().replace(/^\p{L}/u, c=>c.toUpperCase());
const PIE = META.pie || `${tipoTitulo} · ${META.proyecto} · v${META.version}`;
const footerContent = new Paragraph({
  alignment:AlignmentType.RIGHT, spacing:{before:0,after:0}, children:[
  new ImageRun({type:'png',data:img('footer-bar.png'),
    transformation:{width:794,height:121},
    floating:{horizontalPosition:{relative:HorizontalPositionRelativeFrom.PAGE,offset:0},
      verticalPosition:{relative:VerticalPositionRelativeFrom.PAGE,offset:Math.round(26.4*CM)},
      wrap:{type:TextWrappingType.NONE},behindDocument:true}}),
  new TextRun({text:`${PIE}    `,font:FN,size:15,color:GRIS}),
  new TextRun({children:[PageNumber.CURRENT],font:FN,size:17,color:GRIS,bold:true}),
  new TextRun({text:' / ',font:FN,size:15,color:GRIS}),
  new TextRun({children:[PageNumber.TOTAL_PAGES],font:FN,size:15,color:GRIS}),
]});

// ═══ CONTENIDO ═════════════════════════════════════════════════════════════
const B = [];

// ── PORTADA ──
B.push(SP(1600));
if (META.demo === true) {
  B.push(new Paragraph({
    spacing:{before:0,after:400},
    shading:{type:ShadingType.CLEAR,fill:AMBARCL,color:'auto'},
    border:{left:{style:BorderStyle.SINGLE,size:24,color:AMBAR,space:6}},
    indent:{left:140,right:140},
    children:[new TextRun({text:'DOCUMENTO DE EJEMPLO — DATOS FICTICIOS. Generado únicamente para validar el formato. Proyecto, cliente, participantes y cifras son inventados.',font:FN,size:17,bold:true,color:AMBARTX})],
  }));
}
B.push(new Paragraph({spacing:{before:0,after:60},
  children:[new TextRun({text:String(META.tipo).toUpperCase(),font:FL,size:56,bold:true,color:NEGRO})]}));
B.push(new Paragraph({spacing:{before:0,after:200},
  border:{bottom:{style:BorderStyle.SINGLE,size:18,color:VERDE,space:8}},
  children:[new TextRun({text:META.titulo,font:FL,size:40,bold:true,color:VERDE})]}));
B.push(SP(200));
if (META.subtitulo) B.push(P(META.subtitulo,{size:24,bold:true,color:NEGRO,align:AlignmentType.LEFT,after:340}));
B.push(TBL(['Campo','Valor'],META.campos,[30,70],{boldFirst:true}));
if (META.proposito) {
  const pr = typeof META.proposito==='string' ? {texto:META.proposito} : META.proposito;
  B.push(SP(300));
  B.push(P(pr.titulo||'Propósito de este documento',{bold:true,size:22,color:NEGRO,align:AlignmentType.LEFT,after:60}));
  B.push(P(pr.texto));
}
B.push(PB());

// ── ÍNDICE ──
const INDICE = META.indice !== false;
if (INDICE) {
  B.push(H1('Contenido'));
  B.push(SP(60));
  B.push(P('Si el índice se muestra vacío al abrir el documento, colóquese sobre él, haga clic derecho y seleccione "Actualizar campos" (o presione F9).',{italics:true,size:18,align:AlignmentType.LEFT,after:200}));
  B.push(new TableOfContents('Contenido',{hyperlink:true,headingStyleRange:'1-2'}));
  B.push(PB());
}

// ── SECCIONES ──
let S = 0;
SECS.forEach((s,si) => {
  if (si>0 && s.nuevaPagina !== false) B.push(PB());
  else if (si>0) B.push(SP(280));
  const numerada = s.numerada !== false;
  const num = numerada ? ++S : null;
  B.push(H1(NUMERAR && num ? `${num}.  ${s.titulo}` : s.titulo));
  if (s.intro) B.push(P(s.intro));
  const ctx = {num, h2:0};
  (s.bloques||[]).forEach(b => renderBloque(b, ctx, B));
});

if (META.cierre !== false) {
  B.push(SP(400));
  B.push(new Paragraph({alignment:AlignmentType.CENTER,
    border:{top:{style:BorderStyle.SINGLE,size:8,color:VERDE,space:6}},
    spacing:{before:200,after:60},
    children:[new TextRun({text:'Fin del documento',font:FN,size:16,color:GRIS,italics:true})]}));
}

// ═══ DOCUMENTO ═════════════════════════════════════════════════════════════
const doc = new Document({
  creator:'Bambú Tech Services',
  title:`${tipoTitulo} — ${META.titulo}`,
  features:{updateFields:INDICE},
  numbering:{config:[
    {reference:'bambu-bullets',levels:[
      {level:0,format:LevelFormat.BULLET,text:'\u25AA',alignment:AlignmentType.LEFT,
        style:{paragraph:{indent:{left:340,hanging:200}},run:{color:VERDE,font:FN,size:20}}},
      {level:1,format:LevelFormat.BULLET,text:'\u2013',alignment:AlignmentType.LEFT,
        style:{paragraph:{indent:{left:700,hanging:200}},run:{color:VERDE,font:FN,size:20}}}]},
    {reference:'bambu-num',levels:[
      {level:0,format:LevelFormat.DECIMAL,text:'%1.',alignment:AlignmentType.LEFT,
        style:{paragraph:{indent:{left:400,hanging:300}},run:{color:VERDE,font:FL,bold:true,size:20}}},
      {level:1,format:LevelFormat.LOWER_LETTER,text:'%2)',alignment:AlignmentType.LEFT,
        style:{paragraph:{indent:{left:800,hanging:300}},run:{color:VERDE,font:FL,bold:true,size:20}}}]},
  ]},
  styles:{default:{
    document:{run:{font:FL,size:20,color:GRIS}},
    heading1:{run:{font:FL,size:30,bold:true,color:VERDE},paragraph:{outlineLevel:0}},
    heading2:{run:{font:FL,size:26,bold:true,color:VERDE},paragraph:{outlineLevel:1}},
  }},
  sections:[{
    properties:{page:{size:{width:PW,height:PH},
      margin:{top:MT,bottom:MB,left:ML,right:MR,header:340,footer:300}}},
    headers:{default:new Header({children:[headerLogos]})},
    footers:{default:new Footer({children:[footerContent]})},
    children:B,
  }],
});

Packer.toBuffer(doc).then(buf=>{
  fs.mkdirSync(path.dirname(path.resolve(OUT_PATH)),{recursive:true});
  fs.writeFileSync(OUT_PATH,buf);
  console.log(`OK → ${OUT_PATH}  (${(buf.length/1024).toFixed(1)} KB)  secciones=${SECS.length}`);
});
