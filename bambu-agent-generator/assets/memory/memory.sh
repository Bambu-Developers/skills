#!/usr/bin/env bash
# Memoria persistente de agentes. Ver PROTOCOL.md.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIPOS="dominio decision restriccion stakeholder leccion"

die() { printf 'error: %s\n' "$*" >&2; exit 2; }

usage() {
  cat >&2 <<'USAGE'
uso:
  memory.sh recall   <agente> [slug...]      índice, o el cuerpo de recuerdos concretos
  memory.sh remember <agente> <slug> <tipo> "<description>" < cuerpo
  memory.sh forget   <agente> <slug>
  memory.sh check    [agente]                índice vs archivos; sale 1 ante deriva

tipos: dominio | decision | restriccion | stakeholder | leccion
USAGE
  exit 2
}

slug_ok() { [[ "$1" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || die "slug invalido '$1' (kebab-case: solo a-z, 0-9 y guiones)"; }

cmd_recall() {
  local agente="${1:-}"; shift || true
  [ -n "$agente" ] || usage
  local dir="$ROOT/$agente"
  if [ ! -f "$dir/MEMORY.md" ]; then
    echo "Sin memoria previa para '$agente'. Es la primera invocacion, o nadie ha guardado nada todavia."
    return 0
  fi
  if [ "$#" -eq 0 ]; then
    cat "$dir/MEMORY.md"
    return 0
  fi
  local slug
  for slug in "$@"; do
    if [ -f "$dir/$slug.md" ]; then
      printf '\n===== %s =====\n' "$slug"
      cat "$dir/$slug.md"
    else
      printf '\n===== %s =====\n(no existe ese recuerdo)\n' "$slug"
    fi
  done
}

cmd_remember() {
  [ "$#" -eq 4 ] || usage
  local agente="$1" slug="$2" tipo="$3" desc="$4"
  slug_ok "$slug"
  [ "$slug" != "MEMORY" ] || die "'MEMORY' es el indice, no un slug valido"
  grep -qw -- "$tipo" <<<"$TIPOS" || die "tipo invalido '$tipo' (validos: $TIPOS)"
  [ -n "$desc" ] || die "la description no puede ir vacia: es lo que se lee para decidir relevancia"
  case "$desc" in *$'\n'*) die "la description debe caber en una sola linea";; esac

  local cuerpo; cuerpo="$(cat)"
  [ -n "${cuerpo//[[:space:]]/}" ] || die "el cuerpo del recuerdo llego vacio (se lee de stdin)"

  local dir="$ROOT/$agente"; mkdir -p "$dir"
  local archivo="$dir/$slug.md" accion="guardado"
  [ -f "$archivo" ] && accion="actualizado"

  {
    printf -- '---\nname: %s\ndescription: %s\ntype: %s\ndate: %s\n---\n\n' \
      "$slug" "$desc" "$tipo" "$(date +%F)"
    printf '%s\n' "$cuerpo"
  } > "$archivo"

  local indice="$dir/MEMORY.md"
  [ -f "$indice" ] || printf '# Memoria de %s\n\nIndice. Una linea por recuerdo. Lo mantiene memory.sh — no editar a mano.\n\n' "$agente" > "$indice"

  local linea="- [$slug]($slug.md) — $desc"
  if grep -qF -- "($slug.md)" "$indice"; then
    local tmp; tmp="$(mktemp)"
    LINEA="$linea" SLUG="$slug" awk '
      index($0, "(" ENVIRON["SLUG"] ".md)") { print ENVIRON["LINEA"]; next } { print }
    ' "$indice" > "$tmp" && mv "$tmp" "$indice"
  else
    printf '%s\n' "$linea" >> "$indice"
  fi

  printf '%s: %s/%s.md\n' "$accion" "$agente" "$slug"
}

cmd_forget() {
  [ "$#" -eq 2 ] || usage
  local agente="$1" slug="$2"
  slug_ok "$slug"
  local dir="$ROOT/$agente" archivo="$ROOT/$agente/$slug.md"
  [ -f "$archivo" ] || die "no existe el recuerdo '$slug' de '$agente'"
  rm -- "$archivo"
  if [ -f "$dir/MEMORY.md" ]; then
    local tmp; tmp="$(mktemp)"
    SLUG="$slug" awk 'index($0, "(" ENVIRON["SLUG"] ".md)") { next } { print }' "$dir/MEMORY.md" > "$tmp" && mv "$tmp" "$dir/MEMORY.md"
  fi
  printf 'olvidado: %s/%s.md\n' "$agente" "$slug"
}

check_uno() {
  local dir="$1" agente; agente="$(basename "$dir")"
  local indice="$dir/MEMORY.md" fallas=0 f slug
  if [ ! -f "$indice" ]; then
    if compgen -G "$dir/*.md" > /dev/null; then
      printf '%s: hay recuerdos pero no hay MEMORY.md\n' "$agente"; return 1
    fi
    return 0
  fi
  for f in "$dir"/*.md; do
    [ -e "$f" ] || continue
    slug="$(basename "$f" .md)"
    [ "$slug" = "MEMORY" ] && continue
    grep -qF -- "($slug.md)" "$indice" || { printf '%s: recuerdo sin fila en el indice -> %s\n' "$agente" "$slug"; fallas=1; }
    grep -q '^description: .\+' "$f" || { printf '%s: recuerdo sin description -> %s\n' "$agente" "$slug"; fallas=1; }
  done
  while IFS= read -r slug; do
    [ -f "$dir/$slug.md" ] || { printf '%s: fila del indice sin archivo -> %s\n' "$agente" "$slug"; fallas=1; }
  done < <(grep -o '([a-z0-9-]\+\.md)' "$indice" 2>/dev/null | tr -d '()' | sed 's/\.md$//')
  return $fallas
}

cmd_check() {
  local salida=0 dir
  if [ "$#" -ge 1 ]; then
    [ -d "$ROOT/$1" ] || { echo "sin memoria para '$1' — nada que verificar"; return 0; }
    check_uno "$ROOT/$1" || salida=1
  else
    for dir in "$ROOT"/*/; do
      [ -d "$dir" ] || continue
      check_uno "$dir" || salida=1
    done
  fi
  [ "$salida" -eq 0 ] && echo "memoria consistente"
  return $salida
}

case "${1:-}" in
  recall)   shift; cmd_recall   "$@" ;;
  remember) shift; cmd_remember "$@" ;;
  forget)   shift; cmd_forget   "$@" ;;
  check)    shift; cmd_check    "$@" ;;
  *) usage ;;
esac
