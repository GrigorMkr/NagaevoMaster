# VPN «как из другой страны»

## Важно: текущий сервер REG.RU

IP `161.104.18.17` **всегда** определяется как **Россия**, провайдер **REG.RU**.

Сайты (YouTube, whoer.net, Google) смотрят на **IP выхода в интернет**, а не на ваш домашний провайдер. Через VPN они видят IP VPS — сейчас это Россия/REG.RU.

**Скрыть REG.RU и показать другую страну на этом же VPS нельзя** — нужен отдельный сервер за границей.

| Задача | REG.RU VPS (сейчас) | VPS за рубежом |
|--------|---------------------|----------------|
| Скрыть домашний IP | ✅ | ✅ |
| YouTube / Telegram через туннель | ✅ обычно | ✅ |
| Страна ≠ Россия | ❌ | ✅ |
| Не светить REG.RU | ❌ | ✅ |

**API и сайт** остаются на `161.104.18.17`. **VPN** лучше вынести на отдельный зарубежный VPS (~3–5 €/мес).

---

## Рекомендуемые страны (для РФ)

| Провайдер | Локация | Цена | Зачем |
|-----------|---------|------|--------|
| [Hetzner](https://www.hetzner.com/cloud) | Финляндия, Германия | ~4 €/мес | Стабильно, не REG.RU |
| [Aeza](https://aeza.net) | Нидерланды, Германия | ~2–3 €/мес | Дёшево, EU IP |
| [OVH](https://www.ovhcloud.com) | Польша, Франция | ~4 €/мес | EU |

Минимум: **1 vCPU, 1 GB RAM**, Ubuntu 22.04.

---

## Установка Amnezia на зарубежный VPS

### 1. Закажите VPS (например Hetzner Helsinki)

Запишите **новый IP**, например `95.xxx.xxx.xxx`.

### 2. Скопируйте SSH-ключ

```powershell
npm run vps:ssh-setup
# VPS_PASSWORD=... VPS_HOST=95.xxx.xxx.xxx node scripts/vps/setup-ssh-key.mjs
```

Или вручную добавьте `~/.ssh/nagaevomaster_vps.pub` в `/root/.ssh/authorized_keys` на новом сервере.

### 3. Установите AmneziaWG на **новый** сервер

```powershell
$env:VPS_HOST='95.xxx.xxx.xxx'
npm run vps:amnezia
npm run vps:amnezia:optimize
npm run vps:amnezia:privacy
```

Конфиги появятся в `artifacts/amnezia/`.

### 4. AmneziaVPN на телефоне/ПК

1. Удалите старый туннель (REG.RU)
2. Импортируйте **новый** `amnezia-1.conf`
3. Проверьте: https://ifconfig.me — страна **не RU**
4. https://whoer.net — нет «REG.RU»

### 5. Старый REG.RU VPS

На `161.104.18.17` VPN можно **отключить** — оставить только API и сайт:

```powershell
# опционально, только API
$env:VPS_HOST='161.104.18.17'
# ssh root@161.104.18.17 "systemctl stop awg-quick@awg0; systemctl disable awg-quick@awg0"
```

---

## YouTube и Telegram

После VPN на **зарубежном** IP:

- **Telegram** — работает через полный туннель (`AllowedIPs = 0.0.0.0/0`)
- **YouTube** — без региональных ограничений RU (если IP EU/FI/DE)
- В AmneziaVPN: режим **«Весь трафик через VPN»** / Full tunnel

### В приложении Amnezia

- Не включайте split-tunneling для YouTube/Telegram
- Отключите **IPv6** на телефоне в настройках VPN (или используйте наш конфиг без `::/0`)
- DNS в конфиге: **1.1.1.1** (Cloudflare) — уже в `vps:amnezia:privacy`

---

## Что уже сделано на REG.RU (временно)

```powershell
npm run vps:amnezia:privacy
```

- Международный DNS (1.1.1.1)
- Без IPv6-обхода (`::/0` убран)
- Переимпортируйте `artifacts/amnezia/amnezia-1.conf`

Это **не меняет страну IP**, но уменьшает утечки.

---

## Проверка

| Сайт | Ожидание на зарубежном VPS |
|------|----------------------------|
| https://ifconfig.me | IP VPS, страна FI/DE/NL |
| https://whoer.net | Не Russia, не REG.RU |
| YouTube | Открывается, реклама/контент как в EU |
| Telegram | Подключается |

---

## Итог

1. **Сейчас:** REG.RU VPN скрывает только домашний IP, страна всё равно RU  
2. **Нужно:** отдельный VPS в EU (Hetzner/Aeza) + `VPS_HOST=новый_IP npm run vps:amnezia`  
3. **Сайт nagaevomaster.ru** — без изменений, API на старом VPS
