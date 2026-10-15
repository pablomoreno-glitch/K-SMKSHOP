#!/usr/bin/env bash
#
# Restore the databases from one day of backups/ (made by pg-backup.sh).
# Run it on the server from the project folder:
#
#   bash deploy/backup/restore.sh                    # list the available days
#   bash deploy/backup/restore.sh 2026-10-14         # restore every database of that day
#   bash deploy/backup/restore.sh 2026-10-14 vape_orders   # restore only one database
#
# It stops the gateway and the services while restoring so nothing writes in
# between, replaces the current contents of each database with the backup,
# and starts them again.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."
COMPOSE="${COMPOSE:-docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.caddy.yml}"
APP_SERVICES="gateway business catalog inventory orders notifications"

if [[ $# -eq 0 ]]; then
  echo "Respaldos disponibles:"
  ls -1 backups 2>/dev/null | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort -r || echo "  (ninguno)"
  exit 0
fi

day="$1"
only="${2:-}"
dir="backups/$day"
[[ -d "$dir" ]] || { echo "No existe $dir" >&2; exit 1; }

if [[ -n "$only" ]]; then
  [[ -f "$dir/$only.dump" ]] || { echo "No existe $dir/$only.dump" >&2; exit 1; }
  dumps=("$only")
else
  dumps=()
  for f in "$dir"/*.dump; do dumps+=("$(basename "$f" .dump)"); done
fi

echo "Se reemplazará el contenido actual de: ${dumps[*]}"
echo "con el respaldo del $day."
if [[ "${FORCE:-}" != "1" ]]; then
  read -r -p "Escribe RESTAURAR para continuar: " answer
  [[ "$answer" == "RESTAURAR" ]] || { echo "Cancelado."; exit 1; }
fi

$COMPOSE stop $APP_SERVICES
trap '$COMPOSE start $APP_SERVICES' EXIT

for db in "${dumps[@]}"; do
  echo "==> $db"
  $COMPOSE exec -T backup psql -d postgres -v ON_ERROR_STOP=1 -qc "SELECT 1 FROM pg_database WHERE datname = '$db'" -At | grep -q 1 \
    || $COMPOSE exec -T backup psql -d postgres -qc "CREATE DATABASE \"$db\""
  $COMPOSE exec -T backup pg_restore --clean --if-exists --no-owner --exit-on-error -d "$db" "/backups/$day/$db.dump"
done

echo "Restauración completa."
