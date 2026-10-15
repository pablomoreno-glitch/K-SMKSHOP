#!/bin/sh
#
# Daily backup of every vape* database, run by the "backup" service of
# docker-compose.prod.yml. Each day gets its own folder of pg_dump files in
# custom format (one per database), and only the newest BACKUP_KEEP_DAYS
# folders are kept:
#
#   backups/2026-10-14/vape_gateway.dump
#   backups/2026-10-14/vape_orders.dump
#   ...
#
# Without arguments it loops forever and backs up once a day after
# BACKUP_HOUR (container time). "pg-backup.sh once" makes one backup now.
# Restore with deploy/backup/restore.sh (see deploy/README.md).

set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_HOUR="${BACKUP_HOUR:-3}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"

log() { echo "$(date '+%F %T') $*"; }

run_backup() {
  day="$(date +%F)"
  tmp="$BACKUP_DIR/.tmp-$day"
  rm -rf "$tmp"
  mkdir -p "$tmp"

  dbs="$(psql -d postgres -Atc "SELECT datname FROM pg_database WHERE datname LIKE 'vape%' ORDER BY 1")" || {
    log "ERROR: no se pudo listar las bases de datos"
    rm -rf "$tmp"
    return 1
  }
  for db in $dbs; do
    pg_dump -Fc -d "$db" -f "$tmp/$db.dump" || {
      log "ERROR: falló pg_dump de $db"
      rm -rf "$tmp"
      return 1
    }
  done

  # Swap the finished folder in only when every dump succeeded.
  rm -rf "${BACKUP_DIR:?}/$day"
  mv "$tmp" "$BACKUP_DIR/$day"

  # Rotation: keep the newest BACKUP_KEEP_DAYS dated folders.
  ls -1 "$BACKUP_DIR" | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort -r \
    | tail -n +"$((BACKUP_KEEP_DAYS + 1))" | while read -r old; do
      rm -rf "${BACKUP_DIR:?}/$old"
      log "borrado respaldo antiguo $old"
    done

  log "respaldo listo: $BACKUP_DIR/$day ($(du -sh "$BACKUP_DIR/$day" | cut -f1))"
}

mkdir -p "$BACKUP_DIR"

if [ "${1:-}" = "once" ]; then
  run_backup
  exit
fi

log "respaldo diario a partir de las ${BACKUP_HOUR}:00, se conservan ${BACKUP_KEEP_DAYS} días"
while :; do
  hour="$(date +%H | sed 's/^0//')"
  if [ ! -d "$BACKUP_DIR/$(date +%F)" ] && [ "${hour:-0}" -ge "$BACKUP_HOUR" ]; then
    run_backup || log "se reintenta en 10 minutos"
  fi
  sleep 600
done
