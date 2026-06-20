#!/usr/bin/env bash
# Одноразовая установка API на VPS. Запуск на сервере:
#   curl -fsSL ... | bash
# или скопируйте файл и: bash bootstrap-vps.sh
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
export UCF_FORCE_CONFOLD=1
export NEEDRESTART_MODE=a

echo "==> Снятие блокировок apt/dpkg"
killall apt apt-get dpkg 2>/dev/null || true
rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock

echo "==> Починка dpkg"
DEBIAN_FRONTEND=noninteractive dpkg --force-confdef --force-confold --configure -a || true
apt-get -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -f install -y || true

APP_DIR="${APP_DIR:-/var/www/nagaevomaster}"
API_DOMAIN="${API_DOMAIN:-api.nagaevomaster.ru}"
DB_NAME="${DB_NAME:-nagaevomaster}"
DB_USER="${DB_USER:-nagaevomaster}"
DB_PASS="${DB_PASS:-$(openssl rand -hex 16)}"

echo "==> Пакеты (без полного upgrade — меньше диалогов)"
apt-get update -y
apt-get install -y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold \
  curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw

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

echo "==> .env"
if [[ ! -f "${APP_DIR}/backend/.env" ]]; then
  cp "${APP_DIR}/deploy/vps.env.example" "${APP_DIR}/backend/.env"
  sed -i "s/замените-на-надёжный-пароль/${DB_PASS}/g" "${APP_DIR}/backend/.env"
  sed -i "s/ЗАМЕНИТЕ_ПАРОЛЬ/${DB_PASS}/g" "${APP_DIR}/backend/.env"
  sed -i "s/замените-на-длинный-случайный-ключ/$(openssl rand -hex 32)/g" "${APP_DIR}/backend/.env"
fi

echo "==> Деплой API"
RUN_SEED=true bash "${APP_DIR}/scripts/vps/deploy-api.sh"

echo "==> SSL (если DNS api уже указывает на этот сервер)"
if certbot --nginx -d "${API_DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
  echo "SSL OK: https://${API_DOMAIN}"
else
  echo "SSL пока не выпущен — сначала добавьте A-запись api → $(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
fi

echo ""
echo "Готово."
echo "Проверка: curl http://127.0.0.1:4000/api/health"
curl -fsS http://127.0.0.1:4000/api/health && echo ""
echo "Пароль PostgreSQL (сохраните): ${DB_PASS}"
