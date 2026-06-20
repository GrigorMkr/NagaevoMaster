# API на VPS REG.RU

Фронтенд остаётся на shared-хостинге `nagaevomaster.ru`. API переносится на VPS: **без холодного старта**, ответы за миллисекунды.

## Схема

```
nagaevomaster.ru (shared REG.RU)  →  статика React
api.nagaevomaster.ru (VPS)      →  Node.js + PostgreSQL + Nginx
```

## 1. Заказ VPS в REG.RU

1. [REG.RU → VPS / Облако](https://www.reg.ru/vps/) — тариф от **1 vCPU / 1 GB RAM** (достаточно для старта)
2. ОС: **Ubuntu 22.04**
3. Запишите **IP-адрес** и root-пароль (или SSH-ключ)

## 2. DNS

### Вариант A — вручную (быстрее)

ISPmanager DNS: https://dnsadmin.hosting.reg.ru/manager/ispmgr

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `api` | `161.104.18.17` |

### Вариант B — REG.API (скрипт)

1. [reg.ru → Настройки API](https://www.reg.ru/user/account/#/settings/api): **альтернативный пароль** + разрешите IP `136.169.156.224` (ваш текущий)
2. `cp deploy/regru.env.example deploy/regru.env` — заполните `REGRU_API_*` и `REGRU_CLOUD_TOKEN`
3. `node scripts/regru/add-api-dns.mjs`

Проверка (через 5–30 мин): `ping api.nagaevomaster.ru`

## 3. SSH с вашего ПК (без пароля)

Один раз (по паролю root):

```powershell
# Ключ (если нет OpenSSH — через Git):
& "C:\Program Files\Git\usr\bin\ssh-keygen.exe" -t ed25519 -f $env:USERPROFILE\.ssh\nagaevomaster_vps -N '""'

$env:VPS_PASSWORD='пароль-root'
node scripts/vps/setup-ssh-key.mjs
```

Дальше:

```powershell
ssh nagaevomaster-vps
# или Git SSH:
& "C:\Program Files\Git\usr\bin\ssh.exe" nagaevomaster-vps
```

## 4. Первичная настройка VPS (один раз)

Подключитесь по SSH (PowerShell / PuTTY):

```bash
ssh root@ВАШ_IP
```

Скопируйте и выполните на сервере (или загрузите скрипт из репозитория):

```bash
curl -fsSL https://raw.githubusercontent.com/GrigorMkr/NagaevoMaster/main/scripts/vps/install.sh | sudo bash
```

Либо после `git clone`:

```bash
git clone https://github.com/GrigorMkr/NagaevoMaster.git /var/www/nagaevomaster
bash /var/www/nagaevomaster/scripts/vps/install.sh
```

Скрипт установит: Node.js 20, PostgreSQL, Nginx, PM2, Certbot.

## 5. Переменные окружения API

```bash
cp /var/www/nagaevomaster/deploy/vps.env.example /var/www/nagaevomaster/backend/.env
nano /var/www/nagaevomaster/backend/.env
```

Обязательно задайте:

- `JWT_SECRET` — длинная случайная строка
- `POSTGRES_PASSWORD` — пароль БД (тот же, что в `DATABASE_URL`)
- `CORS_ORIGIN` — `https://nagaevomaster.ru,https://www.nagaevomaster.ru`

Опционально для кодов регистрации: `SMTP_*`, `SMS_RU_API_ID`.

## 6. Деплой API

```bash
bash /var/www/nagaevomaster/scripts/vps/deploy-api.sh
```

Проверка:

```bash
curl https://api.nagaevomaster.ru/api/health
# {"status":"ok","service":"nagaevomaster-api"}
```

## 7. SSL (Let's Encrypt)

Если `install.sh` не выпустил сертификат автоматически:

```bash
certbot --nginx -d api.nagaevomaster.ru
```

## 8. Обновить фронтенд (на вашем ПК)

В `.env.production`:

```env
VITE_API_URL=https://api.nagaevomaster.ru/api
VITE_USE_MOCK_FALLBACK=false
```

```powershell
npm run build:hosting
npm run deploy:hosting
```

## 9. Обновление API после изменений в коде

На VPS:

```bash
bash /var/www/nagaevomaster/scripts/vps/deploy-api.sh
```

## Полезные команды

```bash
pm2 status
pm2 logs nagaevomaster-api
pm2 restart nagaevomaster-api
sudo systemctl status nginx
sudo systemctl status postgresql
```

## Аккаунты после seed

- `admin@nagaevomaster.ru` / `admin123`
- `demo@nagaevomaster.ru` / `master123`

## Стоимость

- VPS REG.RU: ~300–600 ₽/мес
- Render можно отключить после переноса
