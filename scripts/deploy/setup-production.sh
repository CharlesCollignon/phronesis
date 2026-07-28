#!/usr/bin/env bash
# Déploiement production Phronesis — GitHub, Neon, Vercel.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

info() { printf '\n→ %s\n' "$*"; }
die() { printf 'Erreur: %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Commande requise: $1"
}

# --- Phase GitHub ---
push_github() {
  info "GitHub — push sur origin/main"
  require_cmd git
  export PATH="${HOME}/.local/bin:${PATH}"
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "git@github.com:CharlesCollignon/phronesis.git"
  fi
  if ! gh auth status >/dev/null 2>&1; then
    die "gh non authentifié. Lancez: gh auth login"
  fi
  if ! gh repo view CharlesCollignon/phronesis >/dev/null 2>&1; then
    gh repo create phronesis --public --source=. --remote=origin
  fi
  git push -u origin main
}

# --- Phase Neon (dump local → restore) ---
restore_neon() {
  info "Neon — restauration du dump"
  require_cmd docker
  : "${NEON_DIRECT_URL:?NEON_DIRECT_URL requis (URL directe, pas pooler)}"
  if [[ ! -f phronesis.dump ]]; then
    info "Export pg_dump depuis Docker…"
    docker exec phronesis-db pg_dump -U phronesis -d phronesis \
      --no-owner --no-acl -F c -f /tmp/phronesis.dump
    docker cp phronesis-db:/tmp/phronesis.dump ./phronesis.dump
  fi
  if command -v pg_restore >/dev/null 2>&1; then
    pg_restore --dbname="$NEON_DIRECT_URL" \
      --no-owner --no-acl --clean --if-exists phronesis.dump
  else
    docker run --rm -v "$ROOT:/dump" postgres:17-alpine \
      pg_restore --dbname="$NEON_DIRECT_URL" \
      --no-owner --no-acl --clean --if-exists /dump/phronesis.dump
  fi
  DATABASE_URL="$NEON_DIRECT_URL" pnpm db:migrate
  rm -f phronesis.dump
}

# --- Phase Vercel env ---
sync_vercel_env() {
  info "Vercel — variables d'environnement"
  require_cmd vercel
  [[ -f .env ]] || die ".env introuvable"
  # shellcheck disable=SC1091
  set -a && source .env && set +a
  : "${DATABASE_URL:?DATABASE_URL requis (URL pooler Neon pour Vercel)}"
  : "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:?}"
  : "${CLERK_SECRET_KEY:?}"
  for target in production preview; do
    for key in \
      DATABASE_URL \
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
      CLERK_SECRET_KEY \
      NEXT_PUBLIC_CLERK_SIGN_IN_URL \
      NEXT_PUBLIC_CLERK_SIGN_UP_URL \
      NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL \
      NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL; do
      val="${!key}"
      printf '%s' "$val" | vercel env add "$key" "$target" --force 2>/dev/null \
        || printf '%s' "$val" | vercel env add "$key" "$target"
    done
  done
}

# --- Empreintes batch (Neon prod) ---
run_empreintes() {
  info "Empreintes — batch vers Neon (limit=${LIMIT:-50})"
  require_cmd pnpm
  [[ -f .env ]] || die ".env introuvable"
  # Évite qu'un DATABASE_URL exporté (ex. Docker) écrase .env
  unset DATABASE_URL
  local limit="${LIMIT:-50}"
  if [[ "${LOOP:-0}" == "1" ]]; then
    batch=0
    while true; do
      batch=$((batch + 1))
      info "Batch $batch"
      out=$(pnpm empreintes:generate -- --limit="$limit" 2>&1) || {
        echo "$out"
        exit 1
      }
      echo "$out" | tail -3
      if echo "$out" | grep -q "0 dossier(s) sans empreinte"; then
        break
      fi
      sleep 2
    done
  else
    pnpm empreintes:generate -- --limit="$limit"
  fi
}

# --- Phase Vercel deploy ---
deploy_vercel() {
  info "Vercel — déploiement production"
  require_cmd vercel
  vercel deploy --prod --yes
  vercel git connect "git@github.com:CharlesCollignon/phronesis.git" \
    2>/dev/null || true
}

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy/setup-production.sh <commande>

Commandes:
  github        Créer/pousser le dépôt GitHub public
  neon-restore  pg_restore vers Neon (NEON_DIRECT_URL requis)
  vercel-env    Synchroniser les variables Vercel depuis .env
  vercel-deploy Déployer en production
  empreintes      Batch empreintes (LOOP=1 LIMIT=50 ./script empreintes)
  all           github + neon-restore + vercel-env + vercel-deploy

Prérequis Neon (une fois):
  1. Accepter les terms: vercel integration accept-terms neon
  2. vercel integration add neon --name phronesis-db -e production -e preview
  3. Copier DATABASE_URL (pooler) dans .env pour vercel-env
  4. Copier l'URL directe dans NEON_DIRECT_URL pour neon-restore
EOF
}

cmd="${1:-}"
case "$cmd" in
  github) push_github ;;
  neon-restore) restore_neon ;;
  vercel-env) sync_vercel_env ;;
  vercel-deploy) deploy_vercel ;;
  empreintes) run_empreintes ;;
  all)
    push_github
    restore_neon
    sync_vercel_env
    deploy_vercel
    ;;
  *) usage; exit 1 ;;
esac

info "Terminé."
