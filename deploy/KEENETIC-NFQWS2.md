# nfqws2 на Keenetic Starter

Утилита [nfqws2-keenetic](https://github.com/nfqws/nfqws2-keenetic) — обход DPI на уровне пакетов (NFQUEUE).  
**Политики Keenetic скрипты не меняют** — только установка пакета и `/opt/etc/nfqws2/nfqws2.conf`.

> Материал в научно-технических целях. Использование — на ваш риск.

## Перед установкой (вручную на роутере)

1. **Entware** — [инструкция Keenetic](https://help.keenetic.com/hc/en-us/articles/360001513780) (встроенная память или USB).
2. Компонент **«Модули ядра подсистемы Netfilter»** (OPKG → Kernel modules for Netfilter).  
   На старых прошивках сначала включите **IPv6**.
3. **Игнорировать DNS от провайдера** + желательно DoT/DoH.
4. В **Интернет-фильтрах** отключить NextDNS, SkyDNS, Яндекс DNS и т.п.
5. Удалить старый пакет, если был: `opkg remove nfqws-keenetic-web nfqws-keenetic`

## Установка с ПК

В `deploy/keenetic.env`:

```env
KEENETIC_HOST=192.168.1.1
KEENETIC_ENTWARE_PORT=222
KEENETIC_ENTWARE_PASSWORD=keenetic
```

Пароль root Entware по умолчанию `keenetic` (смените после первого входа).

```powershell
npm run keenetic:nfqws2:install
npm run keenetic:nfqws2:status
```

| Команда | Действие |
|---------|----------|
| `keenetic:nfqws2:install` | opkg install + наш конфиг |
| `keenetic:nfqws2:status` | процесс, iptables, лог |
| `keenetic:nfqws2:config` | залить `deploy/keenetic/nfqws2/nfqws2.conf` и restart |

## Политика nfqws (вручную)

В веб-интерфейсе: **Приоритеты подключений → Политики доступа** — создайте политику **`nfqws`**, отметьте интерфейс провайдера, назначьте устройства.

В конфиге: `POLICY_NAME="nfqws"`. Режим исключения: `POLICY_EXCLUDE=1`.

## Наш конфиг

Файл: `deploy/keenetic/nfqws2/nfqws2.conf`

- Режим **auto** (`NFQWS_EXTRA_ARGS`) — недоступные домены добавляются в `auto.list`.
- Из UDP-стратегии **убран wireguard**, чтобы не ломать **Wireguard0**.
- Списки доменов — из пакета opkg в `/opt/etc/nfqws2/lists/`.

Редактирование на роутере: `vi /opt/etc/nfqws2/nfqws2.conf` → `npm run keenetic:nfqws2:config` или  
`/opt/etc/init.d/S51nfqws2 restart`

## Проверка

```sh
iptables-save | grep nfqws
/opt/etc/init.d/S51nfqws2 status
tail -f /opt/var/log/nfqws2.log
```

## Частые проблемы

| Ошибка | Решение |
|--------|---------|
| `No chain/target/match` | Установить Netfilter kernel modules |
| `can't initialize ip6tables` | Выключить `IPV6_ENABLED=0` в конфиге |
| Не качается Packages.gz | `opkg install wget-ssl` |
| Не работает с ускорителем | Отключить/включить сетевой ускоритель в Keenetic |

## WireGuard

VPN (`Wireguard0`, Policy2) и nfqws2 работают параллельно: nfqws обрабатывает трафик на **ISP-интерфейсе** для устройств в политике `nfqws`, WG не трогаем.
