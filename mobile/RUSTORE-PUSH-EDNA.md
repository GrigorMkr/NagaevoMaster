# Push-уведомления RuStore через edna Pulse

Инструкция для приложения **Нагаево Мастер** (`ru.nagaevomaster.app`).

Официальная документация edna: [Подключение push для RuStore](https://docs-pulse.edna.ru/docs/channel/push/channel-push-rustore)

## Два канала доставки (работают параллельно)

| Канал | Когда работает | Отправка с сервера |
|-------|----------------|-------------------|
| **FCM** (уже настроен) | Google Play Services, relay через консоль RuStore | `npm run vps:push` → наш API |
| **RuStore Push SDK** (edna / консоль) | Устройства с RuStore, без GMS | edna Pulse или API RuStore |

Сейчас сообщения уходят с VPS через **FCM v1**. RuStore SDK в APK нужен для доставки через облако RuStore и для статуса «Подключено» в edna Pulse.

---

## Требования

- Android **minSdk 24** (в проекте), RuStore SDK — от API 23
- **targetSdk 36** (RuStore рекомендует не выше 35 — при публикации следите за совместимостью)
- Аккаунт [console.rustore.ru](https://console.rustore.ru)
- RuStore на устройстве пользователя (для RuStore-транспорта)
- Release-подпись APK совпадает с загруженной в консоль (`npm run rustore:cert`)

---

## 1. Проект Push в консоли RuStore

1. [Консоль RuStore](https://console.rustore.ru) → приложение **Нагаево Мастер**
2. **Push-уведомления** → **Проекты** → **Добавить проект**
3. Заполнить:

| Поле | Значение |
|------|----------|
| Название | `Нагаево Мастер Prod` |
| Package name | `ru.nagaevomaster.app` |
| SHA-256 | `npm run rustore:cert` |

4. Скопировать **ID проекта**
5. **Сервисные токены** → **Создать** (для API / edna)

Локально (не в git):

```bash
cp deploy/rustore-push.env.example deploy/rustore-push.env
```

```env
RUSTORE_PUSH_PROJECT_ID=ваш_id_из_консоли
RUSTORE_PUSH_SERVICE_TOKEN=активный_ss_token
RUSTORE_PUSH_SERVICE_TOKEN_BACKUP=резервный
```

---

## 2. Регистрация в edna Pulse

Если приложение подключается через **edna Pulse**, передайте менеджеру edna:

- **App package:** `ru.nagaevomaster.app`
- **ID проекта RuStore** — из консоли (шаг 1)
- **Сервисный токен RuStore** — из раздела «Сервисные токены»

После активации в edna приложение отображается со статусом **Подключено** на экране push-канала.

Отправка сообщений через edna идёт из панели edna Pulse; наш FCM на VPS при этом может оставаться для веба и устройств с GMS.

---

## 3. Код в проекте (уже добавлен)

### Gradle

- Репозиторий VK Partner Maven в `android/build.gradle`
- `ru.rustore.sdk:pushclient` в `android/app/build.gradle`
- `RUSTORE_PUSH_PROJECT_ID` в `BuildConfig` (из `deploy/rustore-push.env`)

### Application

`NagaevoMasterApplication` инициализирует `RuStorePushClient`, если задан ID проекта.

### Сборка

```bash
# 1. Заполните deploy/rustore-push.env
npm run android:rustore-push   # прописать project ID в Android
npm run build:rustore          # bundled APK для RuStore
```

Без `deploy/rustore-push.env` сборка проходит как раньше — только FCM.

---

## 4. Условия на устройстве пользователя

- Установлено приложение **RuStore**
- RuStore поддерживает push и может работать в фоне
- Пользователь авторизован в RuStore (для RuStore-транспорта)
- В приложении разрешены уведомления (Android 13+)

---

## 5. FCM + RuStore relay (без edna)

Если edna не используется, достаточно привязать Firebase в консоли RuStore — см. [`RUSTORE-TOOLS.md`](./RUSTORE-TOOLS.md). Код менять не нужно.

---

## 6. Проверка

1. `npm run build:rustore` → установить APK из `artifacts/rustore/`
2. Войти в приложение, разрешить уведомления
3. Отправить тестовое сообщение с другого аккаунта
4. Свернуть приложение — должно прийти системное уведомление
5. Открыть приложение — при новом сообщении звучит мелодия (`message.mp3` / нативный звук)

---

## Ссылки

- [RuStore Push SDK](https://www.rustore.ru/help/sdk/push-notifications)
- [edna Pulse — RuStore](https://docs-pulse.edna.ru/docs/channel/push/channel-push-rustore)
- [Инструменты RuStore в проекте](./RUSTORE-TOOLS.md)
