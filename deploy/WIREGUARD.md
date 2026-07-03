# Личный WireGuard на VPS

WireGuard работает **параллельно** с API и не мешает сайту:

| Сервис | Порт | Протокол |
|--------|------|----------|
| Сайт `nagaevomaster.ru` | shared-хостинг | — |
| API `api.nagaevomaster.ru` | **443** | TCP (HTTPS) |
| WireGuard VPN | **443** | **UDP** (тот же порт, другой протокол — меньше блокировок) |
| SSH | 22 | TCP |

## Установка и усиление

```powershell
# Полный цикл: hardening + WireGuard на UDP 443
npm run vps:wireguard:secure
```

Или по шагам:

```powershell
npm run vps:harden
npm run vps:wireguard
```

Конфиги: `artifacts/wireguard/` (не коммитить).

## Защита от блокировок

| Мера | Зачем |
|------|--------|
| **UDP 443** вместо 51820 | Трафик похож на QUIC/HTTPS, реже режут провайдеры |
| **MTU 1280** | Стабильнее через мобильные сети и DPI |
| **PersistentKeepalive 25** | NAT не рвёт сессию |
| **Только ваши ключи** | Чужие не подключатся (whitelist peers) |
| **Fail2ban + SSH по ключу** | Брутфорс SSH отсекается |
| **UFW: только 22, 80, 443** | Лишние порты закрыты |

### Если всё равно блокируют

Установите **AmneziaWG** (обфускация поверх WireGuard):

```powershell
npm run vps:amnezia
```

Импортируйте `artifacts/amnezia/amnezia-1.conf` в **AmneziaVPN**. Подробно: [`deploy/AMNEZIA.md`](AMNEZIA.md).

Старый WireGuard (`wg0`) при этом отключается. API и сайт не ломаются.

## Подключение

1. [WireGuard](https://www.wireguard.com/install/) → импорт `artifacts/wireguard/client-1.conf`
2. **После смены порта на 443** — удалите старый туннель и импортируйте конфиг заново
3. Endpoint должен быть: `161.104.18.17:443`

## REG.RU

В панели VPS разрешите **входящий UDP 443** (TCP 443 уже открыт для HTTPS).

## QR-код

```bash
qrencode -t ansiutf8 < /root/wireguard-clients/client-1.conf
```

## Проверка

- API: https://api.nagaevomaster.ru/api/health
- VPN: https://ifconfig.me — должен показать IP VPS
