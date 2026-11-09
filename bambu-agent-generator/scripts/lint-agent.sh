#!/usr/bin/env bash
# Chequeo estructural de un agente Bambu. Ver ../references/rubrica.md (criterios marcados con 🔧).
# Uso: lint-agent.sh <agente.md> [agente.md ...]
# Sale 1 si hay algun ERROR. Los AVISO no cambian el codigo de salida.
set -uo pipefail

[ "$#" -ge 1 ] || { echo "uso: lint-agent.sh <agente.md> [agente.md ...]" >&2; exit 2; }

errores=0
colores=""

campo() { # campo <archivo> <clave> -> valor del frontmatter
  awk -v k="$2" 'NR==1&&$0!="---"{exit} NR>1&&$0=="---"{exit} NR>1&&index($0,k": ")==1{print substr($0,length(k)+3); exit}' "$1"
}

lint_uno() {
  local f="$1" e=0
  echo "== $f"
  if [ ! -f "$f" ]; then echo "  ERROR  no existe"; return 1; fi

  local base name desc tools model effort color cuerpo
  base="$(basename "$f" .md)"
  name="$(campo "$f" name)"; desc="$(campo "$f" description)"; tools="$(campo "$f" tools)"
  model="$(campo "$f" model)"; effort="$(campo "$f" effort)"; color="$(campo "$f" color)"
  cuerpo="$(awk 'c>=2{print} /^---$/{c++}' "$f")"

  E() { echo "  ERROR  $*"; e=1; }
  A() { echo "  AVISO  $*"; }

  # Frontmatter (E1, A1, A2)
  [ "$(head -1 "$f")" = "---" ] || E "sin frontmatter"
  [ -n "$name" ] || E "frontmatter sin name"
  [ "$name" = "$base" ] || E "name '$name' no coincide con el archivo '$base' (memory.sh recall leeria otra memoria)"
  case "$name" in bambu-*) ;; *) A "name sin prefijo bambu-";; esac
  [[ "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || E "name no es kebab-case"
  [ -n "$desc" ] || E "frontmatter sin description"
  [ -n "$tools" ] || E "frontmatter sin tools explicitas (heredaria todas)"
  [ -n "$model" ] || A "sin model"
  [ -n "$effort" ] || A "sin effort"
  [ -n "$color" ] || A "sin color"
  grep -qiE 'Úsalo|Usalo|Use (it|this)' <<<"$desc" || A "description sin disparadores ('Úsalo cuando…')"
  grep -qE '(No|no) [^.]*— eso es `|eso es `bambu-' <<<"$desc" || A "description sin frontera ('No hace X — eso es \`Y\`')"
  [ "${#desc}" -le 1200 ] || A "description de ${#desc} caracteres: el orquestador la lee completa en cada decision"

  # Secciones (§ anatomia)
  grep -q '^## Flujo de trabajo' <<<"$cuerpo" || E "falta '## Flujo de trabajo'"
  grep -q '^## Cómo entregas' <<<"$cuerpo" || E "falta '## Cómo entregas'"
  grep -q '^## Reglas duras' <<<"$cuerpo" || E "falta '## Reglas duras'"
  grep -qi '^## La disciplina central' <<<"$cuerpo" || A "sin '## La disciplina central' (ver anatomia § 3)"
  grep -q '^Eres ' <<<"$cuerpo" || A "la identidad no abre con 'Eres …'"
  local nunca; nunca="$(grep -c '^- \*\*Nunca\*\*' <<<"$cuerpo")"
  [ "$nunca" -ge 4 ] || A "solo $nunca reglas '- **Nunca**'"
  [ "$nunca" -le 30 ] || A "$nunca reglas duras: una lista asi se lee como ruido (anatomia § 9)"
  local lineas; lineas="$(wc -l < "$f" | tr -d ' ')"
  [ "$lineas" -le 320 ] || A "$lineas lineas: mueve la referencia tecnica a una skill (rubrica C6)"

  # Memoria (E1, E2)
  grep -qF "memory.sh recall $name" <<<"$cuerpo" || E "no hace 'memory.sh recall $name'"
  grep -qF "memory.sh remember $name" <<<"$cuerpo" || E "no hace 'memory.sh remember $name'"
  grep -qE "memory.sh check( $name)?" <<<"$cuerpo" || A "no cierra con 'memory.sh check $name'"
  grep -q '^### Paso 0 — Recordar' <<<"$cuerpo" || A "el Paso 0 no es '### Paso 0 — Recordar'"
  grep -qiE 'no puedes conversar|no puede conversar' <<<"$cuerpo" || A "no aclara que es subagente y no puede conversar (rubrica D3)"

  # Herramientas (D1)
  local t; t=",$(tr -d ' ' <<<"$tools"),"
  if grep -q 'memory.sh' <<<"$cuerpo" && [[ "$t" != *",Bash,"* ]]; then E "usa memory.sh pero tools no declara Bash"; fi
  if grep -qiE 'invoca (la|el) skill|la skill `|el skill `' <<<"$cuerpo" && [[ "$t" != *",Skill,"* ]]; then E "invoca skills pero tools no declara Skill"; fi
  local m
  for m in $(grep -oE 'mcp__[A-Za-z0-9_-]+__[A-Za-z0-9_]+' <<<"$cuerpo" | sort -u); do
    [[ "$t" == *",$m,"* ]] || E "el cuerpo usa $m y no esta en tools"
  done
  # Por servidor MCP: un agente legitimamente declara la familia completa (p. ej. browser_*),
  # pero si ningun paso nombra NINGUNA herramienta de ese servidor, sobra el servidor entero.
  local srv
  for srv in $(tr ',' '\n' <<<"$tools" | tr -d ' ' | grep '^mcp__' | sed -E 's/^(mcp__[^_]+(-[^_]+)*)__.*/\1/' | sort -u); do
    local alguno=0
    for m in $(tr ',' ' ' <<<"$tools"); do
      case "$m" in "$srv"__*) grep -qF "${m##*__}" <<<"$cuerpo" && alguno=1;; esac
    done
    [ "$alguno" -eq 1 ] || A "declara herramientas de $srv y ningun paso usa ninguna"
  done

  # Slugs de memoria citados (E3)
  local dir mem slug
  dir="$(cd "$(dirname "$f")" && pwd)/memory/$name"
  for slug in $(grep -oE '[Mm]emoria: `[a-z0-9-]+`' <<<"$cuerpo" | sed -E 's/.*`([a-z0-9-]+)`/\1/' | sort -u); do
    if [ ! -f "$dir/$slug.md" ]; then
      mem="$(ls "$(dirname "$dir")"/*/"$slug.md" 2>/dev/null | head -1)"
      if [ -n "$mem" ]; then A "cita el recuerdo '$slug' pero vive en la memoria de $(basename "$(dirname "$mem")"): su recall no lo encuentra"
      else A "cita el recuerdo '$slug' y no existe"; fi
    fi
  done

  # Hechos que se pudren (C5) — heuristico
  grep -nE 'todav[ií]a no existe|est[aá] en estado de scaffold|solo tiene `' "$f" | sed 's/^/  AVISO  posible hecho que se pudre, linea /'

  if [ -n "$color" ]; then
    case " $colores " in *" $color "*) A "color '$color' repetido con otro agente de esta corrida";; esac
    colores="$colores $color"
  fi
  [ "$e" -eq 0 ] && echo "  ok (sin errores)"
  return $e
}

for f in "$@"; do lint_uno "$f" || errores=1; done
exit $errores
