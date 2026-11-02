#!/usr/bin/env bash
# state-check.sh — comprueba que STATE.md no miente sobre los specs que dice resumir.
#
# El tablero es una foto del momento, y la foto se desactualiza sola. Este script compara
# cada fila contra el `> **Status:**` real de su archivo y reporta la deriva. No escribe
# nada: es solo lectura. Sale 1 ante cualquier deriva, 0 si el tablero cuadra.
#
# Compatible con el bash 3.2 que trae macOS: sin arrays asociativos ni `${x,,}`.
set -u

SPECS_DIR=""
QUIET=0

usage() {
  cat <<'USAGE'
state-check.sh — verifica que <specs-dir>/STATE.md coincida con los archivos de spec

  --dir <ruta>   Directorio de specs. Por default: docs/specs si existe, si no specs.
  --quiet        Solo imprime los problemas (sin el resumen final en caso de éxito).
  -h, --help

Comprueba:
  1. STATE.md existe y sus marcadores spec-state:generated están bien formados.
  2. Todo SPEC-NN-*.md tiene exactamente una fila, y toda fila apunta a un archivo real.
  3. El Status de cada fila coincide con el del archivo.
  4. El `Depends on` de cada fila coincide con el del archivo.
  5. Toda dependencia referenciada existe (avisa si alguna está Obsolete).

Sale 0 si el tablero cuadra, 1 si hay deriva.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)   SPECS_DIR="${2:-}"; shift 2 ;;
    --quiet) QUIET=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage >&2; exit 1 ;;
  esac
done

if [ -z "$SPECS_DIR" ]; then
  if [ -d docs/specs ]; then SPECS_DIR="docs/specs"; else SPECS_DIR="specs"; fi
fi

STATE="$SPECS_DIR/STATE.md"
ERRORS=0
WARNINGS=0

err()  { echo "  ✗ $*"; ERRORS=$((ERRORS + 1)); }
warn() { echo "  ! $*"; WARNINGS=$((WARNINGS + 1)); }

# --- Normalizadores -----------------------------------------------------
# Quita la razón/referencia que sigue al guión largo, luego los bytes no-ASCII (emoji),
# luego espacios de sobra. El recorte del guión largo va PRIMERO y por expansión de
# parámetros (comparación de bytes) porque el propio `—` es multibyte: si se quitaran los
# bytes no-ASCII antes, "Obsolete — superseded by X" quedaría como una sola frase.
norm_status() {
  _s="$1"
  _s="${_s%%—*}"
  _s="${_s%% - *}"
  _s="$(printf '%s' "$_s" | LC_ALL=C tr -d '\200-\377' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  # Las etiquetas en español se aceptan como entrada; al pasar por tr pierden el acento
  # ("revisión" → "revisin"), así que se contemplan ambas formas.
  case "$_s" in
    Draft|Borrador)                        printf 'Draft' ;;
    "In review"|"En revisin"|"En revision") printf 'In review' ;;
    Approved|Aprobado)                     printf 'Approved' ;;
    Implemented|Implementado)              printf 'Implemented' ;;
    Obsolete|Obsoleto)                     printf 'Obsolete' ;;
    *)                                     printf '%s' "$_s" ;;
  esac
}

# Reduce cualquier forma de dependencia ("SPEC 02, SPEC 04", "SPEC 02 + 04", "—") a la
# lista ordenada de números: "02,04" o vacío.
norm_deps() {
  printf '%s' "$1" \
    | grep -o '[0-9][0-9]*' \
    | awk '{ printf "%02d\n", $1 }' \
    | sort -u \
    | tr '\n' ',' \
    | sed 's/,$//'
}

header_field() { # header_field <archivo> <etiqueta>
  grep -m1 "^> \*\*$2:\*\*" "$1" 2>/dev/null | sed "s/^> \*\*$2:\*\*[[:space:]]*//"
}

cell() { # cell <línea de tabla> <n de columna>
  printf '%s' "$1" | awk -F'|' -v n="$2" '{ gsub(/^[[:space:]]+|[[:space:]]+$/, "", $n); print $n }'
}

echo "Verificando $STATE"

# --- 1. El tablero existe y sus marcadores están bien -------------------
if [ ! -d "$SPECS_DIR" ]; then
  err "no existe el directorio $SPECS_DIR"
  echo "1 problema."
  exit 1
fi

if [ ! -f "$STATE" ]; then
  err "no existe $STATE — genéralo con bambu-spec-define"
  echo "1 problema."
  exit 1
fi

START_COUNT=$(grep -c 'spec-state:generated:start' "$STATE" 2>/dev/null || true)
END_COUNT=$(grep -c 'spec-state:generated:end' "$STATE" 2>/dev/null || true)

if [ "$START_COUNT" != "1" ] || [ "$END_COUNT" != "1" ]; then
  err "marcadores spec-state:generated mal formados (start: $START_COUNT, end: $END_COUNT; se espera 1 y 1)"
  echo "$ERRORS problema(s)."
  exit 1
fi

START_LINE=$(grep -n 'spec-state:generated:start' "$STATE" | cut -d: -f1)
END_LINE=$(grep -n 'spec-state:generated:end' "$STATE" | cut -d: -f1)
if [ "$START_LINE" -ge "$END_LINE" ]; then
  err "el marcador de cierre aparece antes del de apertura (líneas $START_LINE y $END_LINE)"
  echo "$ERRORS problema(s)."
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

awk '/spec-state:generated:start/ { f = 1; next } /spec-state:generated:end/ { f = 0 } f' \
  "$STATE" > "$TMP/generated.txt"

grep -E '^\|[[:space:]]*[0-9]+[[:space:]]*\|' "$TMP/generated.txt" > "$TMP/rows.txt" 2>/dev/null || true

# --- 2..4. Cada archivo de spec contra su fila --------------------------
SPEC_COUNT=0
for file in "$SPECS_DIR"/SPEC-[0-9]*.md; do
  [ -e "$file" ] || continue
  SPEC_COUNT=$((SPEC_COUNT + 1))
  base=$(basename "$file")
  nn=$(printf '%s' "$base" | sed -n 's/^SPEC-\([0-9][0-9]*\)-.*/\1/p')
  nn_int=$((10#$nn))
  printf '%02d\t%s\n' "$nn_int" "$base" >> "$TMP/files.txt"

  file_status=$(norm_status "$(header_field "$file" 'Status')")
  file_deps=$(norm_deps "$(header_field "$file" 'Depends on')")

  if [ -z "$file_status" ]; then
    err "$base: no tiene línea \`> **Status:**\`"
    continue
  fi

  matches=$(awk -F'|' -v n="$nn_int" '{ gsub(/[^0-9]/, "", $2); if ($2 + 0 == n) print NR }' "$TMP/rows.txt")
  count=$(printf '%s' "$matches" | grep -c . || true)

  if [ "$count" = "0" ]; then
    err "$base: no tiene fila en el tablero (Status real: $file_status)"
    continue
  fi
  if [ "$count" != "1" ]; then
    err "$base: tiene $count filas en el tablero; debe tener exactamente una"
    continue
  fi

  row=$(sed -n "${matches}p" "$TMP/rows.txt")
  row_status=$(norm_status "$(cell "$row" 4)")
  row_deps=$(norm_deps "$(cell "$row" 5)")
  row_link=$(cell "$row" 3 | sed -n 's/.*(\([^)]*\)).*/\1/p')

  if [ "$row_status" != "$file_status" ]; then
    err "$base: el tablero dice \"$row_status\" y el archivo dice \"$file_status\""
  fi
  if [ "$row_deps" != "$file_deps" ]; then
    err "$base: Depends on no coincide — tablero \"${row_deps:-—}\", archivo \"${file_deps:-—}\""
  fi
  if [ -n "$row_link" ] && [ ! -f "$SPECS_DIR/$row_link" ]; then
    err "$base: el enlace de la fila apunta a $row_link, que no existe"
  fi

  # --- 5. Las dependencias existen ------------------------------------
  if [ -n "$file_deps" ]; then
    for dep in $(printf '%s' "$file_deps" | tr ',' ' '); do
      dep_file=$(ls "$SPECS_DIR"/SPEC-"$dep"-*.md 2>/dev/null | head -1)
      if [ -z "$dep_file" ]; then
        err "$base: depende de SPEC $dep, que no existe en $SPECS_DIR"
      else
        dep_status=$(norm_status "$(header_field "$dep_file" 'Status')")
        if [ "$dep_status" = "Obsolete" ]; then
          warn "$base: depende de SPEC $dep, que está Obsolete"
        fi
      fi
    done
  fi
done

# --- 2b. Filas sin archivo ----------------------------------------------
if [ -s "$TMP/rows.txt" ]; then
  while IFS= read -r row; do
    [ -n "$row" ] || continue
    row_nn=$(printf '%s' "$row" | awk -F'|' '{ gsub(/[^0-9]/, "", $2); printf "%02d", $2 + 0 }')
    if ! ls "$SPECS_DIR"/SPEC-"$row_nn"-*.md >/dev/null 2>&1; then
      err "la fila SPEC $row_nn del tablero no corresponde a ningún archivo"
    fi
  done < "$TMP/rows.txt"
fi

ROW_COUNT=$(grep -c . "$TMP/rows.txt" 2>/dev/null || true)

# --- Reporte ------------------------------------------------------------
if [ "$ERRORS" -gt 0 ]; then
  echo "$ERRORS problema(s), $WARNINGS aviso(s) — el tablero no refleja los archivos."
  echo "Regenéralo con bambu-spec-define (nunca parchees una fila a mano)."
  exit 1
fi

if [ "$QUIET" -eq 0 ]; then
  echo "  ✓ $SPEC_COUNT spec(s), $ROW_COUNT fila(s) — el tablero cuadra."
  [ "$WARNINGS" -gt 0 ] && echo "  $WARNINGS aviso(s)."
fi
exit 0
