# SSL на shared-хостинге REG.RU (nagaevomaster.ru)

Сертификат **DomainSSL (GlobalSign)** ставится в **ISPmanager**, не в репозиторий и не в `public/`.

## Ваши файлы

| Файл | Назначение в панели |
|------|---------------------|
| Сертификат домена (блок `-----BEGIN CERTIFICATE-----` из письма REG.RU) | **Сертификат** |
| `certificate (1).key` | **Приватный ключ** |
| `certificate_ca.crt` | **Цепочка / промежуточные CA** |

Срок действия выпущенного сертификата: **20.06.2026 — 05.01.2027**.

Домены в сертификате: `nagaevomaster.ru`, `www.nagaevomaster.ru`, `mail`, `owa`, `autodiscover`.

## Установка в ISPmanager (Host-0, u3552529)

1. Войдите в панель хостинга REG.RU (ISPmanager).
2. **SSL-сертификаты** → **Создать** / **Загрузить**.
3. Вставьте:
   - **Сертификат** — только доменный `.crt` (первый блок из письма, без CSR).
   - **Приватный ключ** — содержимое `certificate (1).key`.
   - **Цепочка** — содержимое `certificate_ca.crt` (два промежуточных CA).
4. **WWW-домены** → `nagaevomaster.ru` → **SSL** → выберите этот сертификат → **Сохранить**.
5. Включите **Перенаправление HTTP → HTTPS** (если ещё не включено).

Проверка:

```bash
curl -sI https://nagaevomaster.ru/ | head -5
openssl s_client -connect nagaevomaster.ru:443 -servername nagaevomaster.ru </dev/null 2>/dev/null | openssl x509 -noout -dates -subject
```

## Локальная подготовка файлов

```powershell
node scripts/prepare-hosting-ssl.mjs
```

Скрипт соберёт `deploy/ssl-local/` (в `.gitignore`) для копирования в панель.

## Важно

- **Не коммитьте** `.key` и сертификаты в git.
- Приватный ключ уже был в чате — после установки храните его только на хостинге и в `Downloads`.
- Для **API** (`api.nagaevomaster.ru`) на VPS используется отдельный Let's Encrypt через Certbot — этот DomainSSL к VPS не относится.

## Проект

Редирект HTTP→HTTPS и заголовки безопасности уже в `public/.htaccess` — после привязки сертификата в панели менять код не нужно.
