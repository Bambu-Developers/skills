#!/usr/bin/env bash
# Crea el esqueleto de carpetas de la arquitectura por capas en un proyecto Angular standalone.
# Nunca sobrescribe un archivo existente: es seguro correrlo sobre un proyecto a medio hacer.
set -euo pipefail

SRC="src/app"
PREFIX=""
DOMAIN=""
AREAS=""
DRY=0

usage() {
  cat <<'USAGE'
scaffold-architecture.sh — esqueleto de carpetas por capas (Angular standalone)

  --prefix <px>      Prefijo de selectores del design system (ej. bam). Requerido.
  --domain <nombre>  Dominio de negocio en singular kebab-case (ej. order). Opcional.
  --areas  <a,b,c>   Áreas de features/ separadas por coma (ej. auth,dashboard). Opcional.
  --src    <ruta>    Raíz del código de la app. Default: src/app
  --dry-run          Solo imprime lo que crearía.
  -h, --help

Ejemplo:
  scaffold-architecture.sh --prefix bam --domain order --areas auth,dashboard
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix) PREFIX="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --areas)  AREAS="$2";  shift 2 ;;
    --src)    SRC="$2";    shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage >&2; exit 1 ;;
  esac
done

[[ -n "$PREFIX" ]] || { echo "Falta --prefix" >&2; exit 1; }
[[ -d "$(dirname "$SRC")" ]] || { echo "No existe $(dirname "$SRC") — ¿estás en la raíz del proyecto?" >&2; exit 1; }

say()  { echo "  $*"; }
mkd()  { [[ $DRY -eq 1 ]] && { say "dir   $1"; return; }; mkdir -p "$1"; }
keep() { [[ $DRY -eq 1 ]] && { say "keep  $1/.gitkeep"; return; }; mkdir -p "$1"; [[ -e "$1/.gitkeep" ]] || touch "$1/.gitkeep"; }
file() { # file <ruta> <<<contenido
  local path="$1"; local body; body="$(cat)"
  if [[ -e "$path" ]]; then say "skip  $path (ya existe)"; return; fi
  [[ $DRY -eq 1 ]] && { say "file  $path"; return; }
  mkdir -p "$(dirname "$path")"; printf '%s\n' "$body" > "$path"; say "file  $path"
}

echo "Esqueleto en $SRC (prefijo: $PREFIX${DOMAIN:+, dominio: $DOMAIN}${AREAS:+, áreas: $AREAS})"

# --- core ---------------------------------------------------------------
keep "$SRC/core/auth/guards"
keep "$SRC/core/auth/services"
keep "$SRC/core/interceptors"
keep "$SRC/core/models"
keep "$SRC/core/tokens"

# --- shared -------------------------------------------------------------
mkd  "$SRC/shared/ui"
keep "$SRC/shared/directives"
keep "$SRC/shared/pipes"
keep "$SRC/shared/utils"
file "$SRC/shared/ui/index.ts" <<'TS'
// Único barrel del proyecto: los primitivos del design system.
// No agregar barrels en core/ ni en features/ — acoplan el grafo de imports
// y arrastran al chunk inicial módulos que debían ser lazy.
export {};
TS

# --- layouts / features -------------------------------------------------
keep "$SRC/layouts"
mkd  "$SRC/features"

if [[ -n "$AREAS" ]]; then
  IFS=',' read -r -a AREA_LIST <<< "$AREAS"
  for area in "${AREA_LIST[@]}"; do
    area="$(echo "$area" | tr -d ' ')"
    [[ -n "$area" ]] || continue
    keep "$SRC/features/$area/pages"
    keep "$SRC/features/$area/ui"
    const="$(echo "$area" | awk -F- '{printf "%s", $1; for(i=2;i<=NF;i++) printf "%s%s", toupper(substr($i,1,1)), substr($i,2)}')Routes"
    file "$SRC/features/$area/$area.routes.ts" <<TS
import type { Routes } from '@angular/router';

/** Rutas de \`$area\`. Todo lazy: una página importada estáticamente aquí deja de tener chunk propio. */
export const $const: Routes = [
  // { path: '', title: '…', loadComponent: () => import('./pages/…/…').then((m) => m.…) },
];
TS
  done
fi

# --- dominio ------------------------------------------------------------
if [[ -n "$DOMAIN" ]]; then
  D="$SRC/core/$DOMAIN"
  pascal="$(echo "$DOMAIN" | awk -F- '{for(i=1;i<=NF;i++) printf "%s%s", toupper(substr($i,1,1)), substr($i,2)}')"
  upper="$(echo "$DOMAIN" | tr 'a-z-' 'A-Z_')"
  file "$D/$DOMAIN.model.ts" <<TS
/** Tipos del dominio. Sin funciones, sin Angular. \`readonly\` por default. */

export interface $pascal {
  readonly id: string;
}

/** Lo que en producción vendrá de configuración; las reglas lo reciben como parámetro. */
export interface ${pascal}Catalogs {
  readonly placeholder?: never;
}
TS
  file "$D/$DOMAIN.rules.ts" <<TS
import type { $pascal, ${pascal}Catalogs } from './$DOMAIN.model';

/**
 * Reglas de negocio como funciones puras: sin Angular, sin UI, sin constantes
 * internas — el catálogo entra como parámetro para que el backend real no
 * obligue a tocar una sola regla.
 */
export function isComplete(entity: $pascal, catalogs: ${pascal}Catalogs): boolean {
  void catalogs;
  return Boolean(entity.id);
}
TS
  file "$D/$DOMAIN.rules.spec.ts" <<TS
import { describe, expect, it } from 'vitest';
import { isComplete } from './$DOMAIN.rules';

describe('${DOMAIN} rules', () => {
  it('placeholder', () => {
    expect(isComplete({ id: '1' }, {})).toBe(true);
  });
});
TS
  file "$D/$DOMAIN.repository.ts" <<TS
import { InjectionToken } from '@angular/core';
import type { $pascal } from './$DOMAIN.model';

export interface ${pascal}Repository {
  list(): Promise<readonly $pascal[]>;
  getById(id: string): Promise<$pascal | null>;
}

/** Las pantallas inyectan ESTE token, nunca la clase mock. */
export const ${upper}_REPOSITORY = new InjectionToken<${pascal}Repository>('${pascal}Repository');
TS
  file "$D/mock-$DOMAIN.repository.ts" <<TS
import type { $pascal } from './$DOMAIN.model';
import type { ${pascal}Repository } from './$DOMAIN.repository';

/**
 * Única implementación del repositorio: el único archivo que el día del backend
 * real cambia. Mantiene la latencia simulada para que los estados de carga se
 * diseñen desde el principio.
 */
export class Mock${pascal}Repository implements ${pascal}Repository {
  private readonly items: $pascal[] = [];

  async list(): Promise<readonly $pascal[]> {
    await delay();
    return this.items;
  }

  async getById(id: string): Promise<$pascal | null> {
    await delay();
    return this.items.find((i) => i.id === id) ?? null;
  }
}

function delay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
TS
  echo
  echo "Registra el repositorio en app.config.ts:"
  echo "  { provide: ${upper}_REPOSITORY, useClass: Mock${pascal}Repository }"
fi

# --- estilos ------------------------------------------------------------
mkd "src/styles"
file "src/styles/theme.css" <<CSS
/* Tokens semánticos del design system — fuente de verdad del tema.
   La UI consume solo tokens (bg-surface, text-fg-muted…), nunca escalas crudas. */
CSS

echo
echo "Listo. Prefijo de selectores: ${PREFIX}- para shared/ui, app- para features."
