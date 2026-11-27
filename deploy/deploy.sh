#!/usr/bin/env bash
# Deploy lên VPS: đồng bộ mã nguồn rồi build + chạy container trên đó.
# Dùng: ./deploy/deploy.sh   (cần alias "vps" trong ~/.ssh/config)
set -euo pipefail
HOST=${HOST:-vps}
DIR=${DIR:-/srv/job-analysis}
cd "$(dirname "$0")/.."

rsync -az --delete \
  --exclude node_modules --exclude .next --exclude out --exclude .git \
  --exclude .claude --exclude .superpowers --exclude deploy/.env --exclude "crawler/node_modules" \
  --exclude /data/ --exclude public/data/ --exclude "*.tsbuildinfo" \
  ./ "$HOST:$DIR/"

# Thư mục snapshot cho dashboard: crawler (user node, uid 1000) ghi, nginx đọc
ssh "$HOST" "mkdir -p $DIR/data && chown 1000:1000 $DIR/data"
ssh "$HOST" "cd $DIR/deploy && docker compose up -d --build && docker compose --profile crawler build crawler && docker image prune -f >/dev/null"
# Lịch cào + export + sao lưu mỗi đêm
ssh "$HOST" "cp $DIR/deploy/systemd/job-analysis-crawl.* /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now job-analysis-crawl.timer >/dev/null"
ssh "$HOST" "docker exec job-analysis wget -qO- http://127.0.0.1/overview | grep -q 'Hiring intelligence' && echo 'OK: job-analysis đang chạy'"
