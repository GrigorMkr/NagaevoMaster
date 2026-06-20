# Email и SMS при регистрации

Коды подтверждения уже реализованы в API (`POST /auth/register/send-code`). Без настроек коды пишутся только в лог PM2.

## 1. Почта (REG.RU)

### Создать ящик

1. ISPmanager хостинга → **Почта** → **Почтовые ящики**
2. Создайте, например: `noreply@nagaevomaster.ru` (запомните пароль)
3. Включите **DKIM** для домена (если есть в панели) — лучше доставляемость

### Параметры SMTP

| Переменная | Значение |
|------------|----------|
| `SMTP_HOST` | `mail.hosting.reg.ru` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` (STARTTLS) |
| `SMTP_USER` | `noreply@nagaevomaster.ru` |
| `SMTP_PASS` | пароль ящика |
| `SMTP_FROM` | `Нагаево Мастер <noreply@nagaevomaster.ru>` |

## 2. SMS (SMS.ru)

1. Регистрация: https://sms.ru
2. **API** → скопируйте `api_id`
3. Пополните баланс (≈2–3 ₽ за SMS)
4. В `deploy/notify.env`: `SMS_RU_API_ID=ваш-ключ`

Отправитель по умолчанию — короткий номер SMS.ru (для кодов достаточно).

## 3. Применить на VPS

На вашем ПК:

```powershell
cp deploy/notify.env.example deploy/notify.env
# отредактируйте SMTP_PASS и SMS_RU_API_ID

npm run vps:notify
```

Скрипт обновит `/var/www/nagaevomaster/backend/.env` и перезапустит PM2.

## 4. Проверка

```powershell
npm run vps:notify:test
```

Или вручную на сайте: **Регистрация** → выбрать Email или SMS → «Получить код».

Логи на VPS:

```bash
ssh nagaevomaster-vps
pm2 logs nagaevomaster-api --lines 50
```

Успех: `[email] sent to ...` или SMS без ошибки. В dev без ключей: `[email:dev]` / `[sms:dev]` в логе.

## Локальная разработка

В `backend/.env` те же переменные. Без SMTP/SMS код появится в консоли `npm run dev`.
