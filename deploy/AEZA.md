# Aeza — VPN VPS (Германия)

Панель: [my.aeza.net](https://my.aeza.net)  
API-ключи: [my.aeza.net/settings/apikeys](https://my.aeza.net/settings/apikeys)

---

## 1. SSH-ключ (сначала!)

На Aeza ключ попадает на сервер **только при создании или переустановке ОС**.

### Создать ключ в панели

1. **Настройки** → **SSH-ключи** → **Создать**
2. **Имя:** `nagaevo` или `Рабочий компьютер`
3. **Содержимое** — публичный ключ с ПК:

```powershell
npm run vps:aeza:ssh-pubkey
```

Скопируйте строку `ssh-ed25519 AAAA...` целиком.

4. ✅ **«Автоматически добавлять на серверы»** — включить
5. Сохранить

### Если сервер уже создан без ключа

**Переустановите ОС** на VPS (Ubuntu 22.04, не 26.04):

- Панель → ваш сервер `numerous-amber` → **Переустановить**
- ОС: **Ubuntu 22.04**
- SSH-ключ: **nagaevo** (галочка)
- ПО: ничего не выбирать

После переустановки SSH по ключу:

```powershell
ssh root@213.176.95.209
```

---

## 2. API-ключ

1. [Настройки → API-ключи](https://my.aeza.net/settings/apikeys)
2. **Создать** → имя `nagaevo` (3–32 символа)
3. Скопировать токен (**один раз**)

Локально:

```powershell
copy deploy\vps-de.env.example deploy\vps-de.env
```

`deploy/vps-de.env`:

```env
AEZA_API_KEY=ваш_токен
VPS_DE_HOST=213.176.95.209
```

Не коммитить в git.

---

## 3. Команды с ПК

```powershell
npm run vps:aeza:status       # список серверов
npm run vps:aeza:reboot       # перезагрузка

# когда ping 213.176.95.209 отвечает:
$env:VPS_HOST='213.176.95.209'
npm run vps:wireguard:reinstall
```

Конфиги VPN: `artifacts/wireguard/client-1.conf`, `keenetic-router.conf`  
Endpoint: **213.176.95.209:51820** UDP

---

## 4. Keenetic

См. `deploy/KEENETIC.md` — импорт `keenetic-router.conf`, CLI `permit global Wireguard0`.

---

## Важно

| Сервер | Назначение |
|--------|------------|
| `161.104.18.17` REG.RU | Сайт + API |
| `213.176.95.209` Aeza | Только VPN |

Для VPN на Aeza берите **Ubuntu 22.04** (на 26.04 Amnezia PPA не работает — используем WireGuard).
