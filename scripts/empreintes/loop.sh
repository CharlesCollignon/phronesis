#!/usr/bin/env bash
# Boucle empreintes jusqu'à épuisement (stop fiable hors substring "50").
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
unset DATABASE_URL
LOG="${EMPREINTES_LOG:-/tmp/phronesis-empreintes.log}"

echo "→ Empreintes loop started $(date -Iseconds)" | tee -a "$LOG"

while true; do
  out=$(pnpm empreintes:generate -- --limit=50 2>&1) || {
    echo "$out" | tee -a "$LOG"
    echo "LOOP_FAIL $(date -Iseconds)" | tee -a "$LOG"
    exit 1
  }
  echo "$out" | tee -a "$LOG" | tail -3
  if echo "$out" | grep -qE '(^|[^0-9])0 dossier\(s\) sans empreinte'; then
    echo "LOOP_DONE $(date -Iseconds)" | tee -a "$LOG"
    exit 0
  fi
  if echo "$out" | grep -qiE 'storage|quota|ENOSPC|exceeds the'; then
    echo "STORAGE_BLOCK $(date -Iseconds)" | tee -a "$LOG"
    exit 2
  fi
  sleep 2
done
