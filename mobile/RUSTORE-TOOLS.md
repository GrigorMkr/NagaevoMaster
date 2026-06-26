# Бесплатные инструменты RuStore для «Нагаево Мастер»

Консоль: [console.rustore.ru](https://console.rustore.ru) → **Инструменты**

Официальный обзор: [Инструменты RuStore](https://www.rustore.ru/help/developers/tools)

## Уже работает в проекте

| Инструмент | Статус | Где в коде |
|------------|--------|------------|
| **Push (FCM)** | Подключён | Capacitor `@capacitor/push-notifications`, Firebase, `backend` FCM v1 |
| **VK ID** | Подключён | `/api/auth/vk`, кнопка «ВКонтакте» на сайте и в приложении |
| **VK Карты** | Готов к ключу | `backend/src/services/vkMaps.ts` — поиск и обратное геокодирование адресов |

## 1. Push-уведомления (бесплатно)

Приложение уже шлёт push через **Firebase Cloud Messaging**.

### В консоли RuStore

1. **Инструменты** → **Push-уведомления** → подключить.
2. Указать тот же **Firebase-проект**, что в `deploy/google-services.json`.
3. Загрузить **Server key / FCM v1** (у вас уже на VPS после `npm run vps:push`).

### Локально / VPS

```bash
npm run android:firebase   # google-services.json в APK
npm run fcm:setup          # сервисный аккаунт
npm run vps:push           # ключи на сервер
npm run build:apk
```

RuStore добавляет доставку через свой транспорт на устройствах без Google Play Services — подключение в консоли достаточно, код менять не нужно.

**Push через edna Pulse + RuStore SDK в APK:** см. [`RUSTORE-PUSH-EDNA.md`](./RUSTORE-PUSH-EDNA.md).

### Создание проекта Push в консоли

| Поле | Значение |
|------|----------|
| **Проект production-сборки** | Включить (галочка) |
| **Название** | `Нагаево Мастер Prod` |
| **Android package name** | `ru.nagaevomaster.app` |
| **SHA-256** | см. `npm run rustore:cert` |

Текущий отпечаток подписи release APK:

```
0A:07:46:2F:8B:4B:D8:CF:B0:9C:6C:A3:EE:EC:BB:36:99:4C:D8:5B:D9:FF:40:5F:43:B8:42:BF:56:55:ED:FC
```

### Сервисные токены (2 из 5)

После создания проекта RuStore выдаёт **сервисные токены** (`ss_token`).

| Правило | Пояснение |
|---------|-----------|
| **Активен только один** | В работе — один токен, второй храните как резерв |
| **Зачем** | Отправка push через API RuStore (`Authorization: Bearer …`) |
| **Сейчас в приложении** | Push идёт через **FCM** — токены RuStore **не обязательны** |
| **Когда понадобятся** | Если подключите RuStore Universal Push SDK или отправку через `vkpns-universal.rustore.ru` |

Сохраните локально (не в git):

```bash
cp deploy/rustore-push.env.example deploy/rustore-push.env
```

```env
RUSTORE_PUSH_PROJECT_ID=числовой_id_из_консоли
RUSTORE_PUSH_SERVICE_TOKEN=один_активный_токен
RUSTORE_PUSH_SERVICE_TOKEN_BACKUP=второй_резервный
```

**Не публикуйте токены в чатах и репозитории.** При утечке — удалите токен в консоли и создайте новый.

---

## 2. VK ID (бесплатно)

### В консоли RuStore / VK ID

1. **Инструменты** → **VK ID** → привязать приложение `ru.nagaevomaster.app`.
2. В [кабинете VK ID](https://id.vk.com/about/business/go/docs/ru/vkid/latest/vk-id/connection/create-application) проверьте (платформа **Web**):
   - **ID приложения** — в `VK_CLIENT_ID` на VPS
   - **Защищённый ключ** — в `VK_CLIENT_SECRET`
   - **Базовый домен**: `nagaevomaster.ru` (без `https://` и без `/`)
   - **Доверенный redirect URL**: `https://nagaevomaster.ru/api/auth/vk/callback`
3. Для **Android** в том же приложении VK ID (если есть вкладка):
   - package: `ru.nagaevomaster.app`
   - SHA-256: `npm run rustore:cert`

### На VPS

```bash
npm run oauth:setup
npm run vps:oauth
npm run vps:deploy
```

### В приложении

- **Сайт и Android (RuStore)**: одна кнопка «ВКонтакте» → серверный OAuth (`/api/auth/vk`)

---

## 3. VK Карты (бесплатно)

Лучше находит адреса в России (Уфа, Нагаево, сёла), чем OpenStreetMap.

### В консоли RuStore

1. **Инструменты** → **VK Карты** → подключить.
2. Скопировать **API-ключ**.

### На VPS

В `backend/.env` или через локальный файл:

```bash
cp deploy/vkmaps.env.example deploy/vkmaps.env
# вписать VK_MAPS_API_KEY
npm run vps:vkmaps
```

Либо вручную в `backend/.env`:

```env
VK_MAPS_API_KEY=ваш_ключ
```

```bash
npm run vps:deploy
```

Без ключа адреса ищутся через OpenStreetMap (запасной вариант).

---

## 4. Tracer — ошибки (бесплатно, опционально)

Краш-репорты для нативного Android. Требует SDK в `android/`.

1. **Инструменты** → **Tracer** → создать проект.
2. Добавить SDK по [документации Tracer](https://www.rustore.ru/help/developers/tools/tracer).
3. Собрать новый APK: `npm run build:rustore`.

Для веб-части (Capacitor загружает сайт) Tracer ловит в основном нативные сбои.

---

## 5. MyTracker — аналитика (бесплатно, опционально)

1. **Инструменты** → **MyTracker** → создать счётчик.
2. Подключить SDK Android / веб-пиксель по инструкции MyTracker.

---

## 6. Remote Config (бесплатно, опционально)

Удалённая конфигурация без обновления APK. Подключается через **Каталог SDK** в консоли RuStore.

Полезно для: включения/отключения функций, текстов баннеров, лимитов.

---

## Локальное хранение секретов

Все ключи RuStore/VK — в `deploy/` (файлы `*.env` в `.gitignore`):

| Файл | Содержимое |
|------|------------|
| `deploy/secrets.local.env` | **Сводная копия** всего (резерв на флешку) |
| `deploy/rustore-push.env` | Push: project ID, SHA-256, сервисные токены |
| `deploy/vkmaps.env` | VK Карты API key |
| `deploy/oauth.env` | VK ID, Google OAuth |
| `deploy/push.env` | FCM / VAPID |

На VPS уже применено: `VK_MAPS_API_KEY` (`npm run vps:vkmaps`).

Push-токены RuStore на сервер **пока не нужны** — push через FCM.

---

- [x] Приложение одобрено в RuStore
- [x] `rustorePublished: true` в `mobile/app-version.json`
- [ ] `npm run deploy:hosting` — кнопка RuStore на `/app`
- [ ] Push в консоли RuStore → привязать FCM
- [ ] VK ID → проверить redirect и ключи на VPS
- [ ] VK Карты → `VK_MAPS_API_KEY` на VPS
- [ ] (по желанию) Tracer + MyTracker

## Полезные ссылки

- [Каталог приложения](https://www.rustore.ru/catalog/app/ru.nagaevomaster.app)
- [VK Карты — геокодирование](https://dev.vk.com/ru/vkmaps/search-and-geocoding/geocoding)
- [VK ID для веба](https://dev.vk.com/ru/vkid/latest)
