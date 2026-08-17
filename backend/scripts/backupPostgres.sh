#!/bin/sh
set -e
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target=${BACKUP_PATH:-"./holameet-$stamp.sql"}
pg_dump "$DATABASE_URL" --no-owner --format=plain --file="$target"
echo "$target"
