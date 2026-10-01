#!/usr/bin/env bash
# Arma el nombre, valida, actualiza la base correcta y crea la rama.
# Uso: create-branch.sh <tipo> <modulo> <descripcion> [ticket]
#   tipo: feature|fix|hotfix|refactor|chore|docs
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

type="${1:-}"
module="${2:-}"
description="${3:-}"
ticket="${4:-}"

if [[ -z "$type" || -z "$module" || -z "$description" ]]; then
  echo "Uso: $0 <tipo> <modulo> <descripcion> [ticket]" >&2
  echo "tipo: feature|fix|hotfix|refactor|chore|docs" >&2
  exit 2
fi

branch="${type}/${module}-${description}"
if [[ -n "$ticket" ]]; then
  branch="${branch}-${ticket}"
fi

"$SCRIPT_DIR/validate-branch-name.sh" "$branch"

if [[ "$type" == "hotfix" ]]; then
  base="main"
else
  base="dev"
fi

if git show-ref --verify --quiet "refs/heads/$branch"; then
  echo "ERROR: ya existe una rama local '$branch'." >&2
  exit 1
fi
if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
  echo "ERROR: ya existe una rama remota 'origin/$branch'." >&2
  exit 1
fi

git fetch origin "$base"
git checkout "$base"
git pull --ff-only origin "$base"
git checkout -b "$branch"

echo "Rama creada: $branch (desde $base, actualizado)"
if [[ "$type" == "hotfix" ]]; then
  echo "Plazo máximo de vida: 1 día hábil (no considera feriados)."
else
  echo "Plazo máximo de vida: 5 días hábiles (no considera feriados)."
fi
echo "Recuerda: el PR se abre en BORRADOR desde el primer push."
