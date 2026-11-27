#!/usr/bin/env bash
# Sao lưu CSDL job-analysis vào /srv/backups/job-analysis, giữ 14 ngày.
set -euo pipefail
DIR=/srv/backups/job-analysis
mkdir -p "$DIR" && chmod 700 "$DIR"
FILE="$DIR/jobs-$(date +%Y%m%d-%H%M).sql.gz"
docker exec job-analysis-db pg_dump -U jobs -d jobs --no-owner | gzip > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
find "$DIR" -name 'jobs-*.sql.gz' -mtime +14 -delete
echo "Đã sao lưu $FILE ($(du -h "$FILE" | cut -f1))"
