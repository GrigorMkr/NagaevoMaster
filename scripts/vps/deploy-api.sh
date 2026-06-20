#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/nagaevomaster}"
BACKEND_DIR="${APP_DIR}/backend"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "Репозиторий не найден в ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"
echo "==> git pull"
git pull origin main

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
pm2 startOrRestart "${APP_DIR}/deploy/pm2.ecosystem.cjs" --update-env
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "==> Health"
sleep 2
curl -fsS "http://127.0.0.1:4000/api/health" && echo ""
echo "Деплой API завершён."
