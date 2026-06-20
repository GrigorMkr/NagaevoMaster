#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/nagaevomaster}"
BACKEND_DIR="${APP_DIR}/backend"

if [[ ! -d "${BACKEND_DIR}" ]]; then
  echo "Backend не найден в ${BACKEND_DIR}"
  exit 1
fi

cd "${BACKEND_DIR}"

if [[ ! -f .env ]]; then
  echo "Нет backend/.env — скопируйте deploy/vps.env.example"
  exit 1
fi

echo "==> npm install + build"
export NPM_CONFIG_PRODUCTION=false
npm install
npm run build
npx prisma db push
if [[ "${RUN_SEED:-false}" == "true" ]]; then
  npm run db:seed
fi

mkdir -p uploads

echo "==> PM2"
if pm2 describe nagaevomaster-api >/dev/null 2>&1; then
  pm2 restart nagaevomaster-api --update-env
else
  pm2 start dist/index.js \
    --name nagaevomaster-api \
    --cwd "${BACKEND_DIR}" \
    --max-memory-restart 400M
fi
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "==> Health"
sleep 2
curl -fsS "http://127.0.0.1:4000/api/health" && echo ""
echo "Деплой API завершён."
