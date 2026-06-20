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

В ISPmanager / DNS домена `nagaevomaster.ru`:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `api` | IP вашего VPS |

Проверка (через 5–30 мин): `ping api.nagaevomaster.ru`

## 3. Первичная настройка VPS (один раз)

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

## 4. Переменные окружения API

```bash
cp /var/www/nagaevomaster/deploy/vps.env.example /var/www/nagaevomaster/backend/.env
nano /var/www/nagaevomaster/backend/.env
```

Обязательно задайте:

- `JWT_SECRET` — длинная случайная строка
- `POSTGRES_PASSWORD` — пароль БД (тот же, что в `DATABASE_URL`)
- `CORS_ORIGIN` — `https://nagaevomaster.ru,https://www.nagaevomaster.ru`

Опционально для кодов регистрации: `SMTP_*`, `SMS_RU_API_ID`.

## 5. Деплой API

```bash
bash /var/www/nagaevomaster/scripts/vps/deploy-api.sh
```

Проверка:

```bash
curl https://api.nagaevomaster.ru/api/health
# {"status":"ok","service":"nagaevomaster-api"}
```

## 6. SSL (Let's Encrypt)

Если `install.sh` не выпустил сертификат автоматически:

```bash
certbot --nginx -d api.nagaevomaster.ru
```

## 7. Обновить фронтенд (на вашем ПК)

В `.env.production`:

```env
VITE_API_URL=https://api.nagaevomaster.ru/api
VITE_USE_MOCK_FALLBACK=false
```

```powershell
npm run build:hosting
npm run deploy:hosting
```

## 8. Обновление API после изменений в коде

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
