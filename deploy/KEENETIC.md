# WireGuard — Keenetic Starter + ПК/телефон

**Рабочий вариант:** VPN на **ПК и телефоне** — `artifacts/wireguard/client-1.conf` (Германия `213.176.95.209:41194`).

**Полный VPN на Wi‑Fi:** импорт `keenetic-router.conf` → `npm run keenetic:wg-import` → `npm run keenetic:wg-policy`. **Политики — только вручную** (веб-интерфейс или `deploy/keenetic/cli-wireguard-working.txt`).

**Сайт `nagaevomaster.ru` и API на REG.RU не затрагиваются.**

---

## Топология

```
GPON ONU  →  Keenetic WAN  →  Wi‑Fi 192.168.1.x
```

---

## VPN на ПК / телефоне

1. Импорт `artifacts/wireguard/client-1.conf` в WireGuard или Amnezia.
2. Проверка: https://ifconfig.me → `213.176.95.209`.

```powershell
npm run vps:wg:check
```

---

## Роутер (только при необходимости)

| Команда | Зачем |
|---------|--------|
| `npm run keenetic:wg-import` | импорт `keenetic-router.conf` |
| `npm run keenetic:wg-policy` | туннель WireGuard (без политик) |
| `npm run keenetic:restore-internet` | выключить `Wireguard0` (без политик) |

CLI вручную: `deploy/keenetic/cli-wireguard-working.txt`

**nfqws2 (обход DPI):** `deploy/KEENETIC-NFQWS2.md` → `npm run keenetic:nfqws2:install`

---

## Безопасность

- Пароли роутера и ключи WireGuard не коммитить.
- `artifacts/wireguard/` в `.gitignore`.

## Сайт и API

| Сервис | Где |
|--------|-----|
| `nagaevomaster.ru` | REG.RU хостинг |
| `api.nagaevomaster.ru` | REG.RU VPS `161.104.18.17` |
| VPN | Aeza `213.176.95.209` |
