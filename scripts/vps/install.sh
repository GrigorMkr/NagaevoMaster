#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/nagaevomaster}"
API_DOMAIN="${API_DOMAIN:-api.nagaevomaster.ru}"
DB_NAME="${DB_NAME:-nagaevomaster}"
DB_USER="${DB_USER:-nagaevomaster}"
DB_PASS="${DB_PASS:-$(openssl rand -hex 16)}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Запустите от root: sudo bash scripts/vps/install.sh"
  exit 1
fi

echo "==> Обновление пакетов"
export DEBIAN_FRONTEND=noninteractive
export UCF_FORCE_CONFOLD=1
apt-get update -y
dpkg --configure -a || true
apt-get -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -f install -y || true
apt-get -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold upgrade -y || true
apt-get install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw

echo "==> Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> PM2"
npm install -g pm2

echo "==> PostgreSQL"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

echo "==> Репозиторий"
mkdir -p "$(dirname "${APP_DIR}")"
if [[ ! -d "${APP_DIR}/.git" ]]; then
  git clone https://github.com/GrigorMkr/NagaevoMaster.git "${APP_DIR}"
fi

echo "==> Nginx"
install -m 644 "${APP_DIR}/deploy/nginx-api.conf.example" /etc/nginx/sites-available/nagaevomaster-api
ln -sf /etc/nginx/sites-available/nagaevomaster-api /etc/nginx/sites-enabled/nagaevomaster-api
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> .env (если ещё нет)"
if [[ ! -f "${APP_DIR}/backend/.env" ]]; then
  cp "${APP_DIR}/deploy/vps.env.example" "${APP_DIR}/backend/.env"
  sed -i "s/замените-на-надёжный-пароль/${DB_PASS}/g" "${APP_DIR}/backend/.env"
  sed -i "s/ЗАМЕНИТЕ_ПАРОЛЬ/${DB_PASS}/g" "${APP_DIR}/backend/.env"
  echo "Сгенерирован JWT_SECRET — отредактируйте backend/.env при необходимости"
  sed -i "s/замените-на-длинный-случайный-ключ/$(openssl rand -hex 32)/g" "${APP_DIR}/backend/.env"
fi

echo "==> Первый деплой API"
RUN_SEED=true bash "${APP_DIR}/scripts/vps/deploy-api.sh"

echo "==> SSL"
if certbot --nginx -d "${API_DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
  echo "SSL выпущен для ${API_DOMAIN}"
else
  echo "Certbot не смог выпустить сертификат. Проверьте DNS A-запись ${API_DOMAIN} и запустите:"
  echo "  certbot --nginx -d ${API_DOMAIN}"
fi

echo ""
echo "Готово."
echo "API: https://${API_DOMAIN}/api/health"
echo "Пароль PostgreSQL (сохраните): ${DB_PASS}"
echo "Файл env: ${APP_DIR}/backend/.env"
