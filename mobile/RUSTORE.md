# Публикация в RuStore

Официальная инструкция: [Публикация приложений в RuStore](https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication)

Консоль: [console.rustore.ru](https://console.rustore.ru)

## Зачем RuStore

Установка из RuStore **не показывает** предупреждение Play Защиты «неизвестный разработчик», как при APK с сайта.

## 1. Регистрация

1. Войдите в [RuStore Console](https://console.rustore.ru/sign-in) (физлицо или компания).
2. Заполните профиль разработчика (паспорт / ИНН по типу аккаунта).

## 2. API-ключ (опционально, для автоматизации)

Страница: [API RuStore → ключи](https://console.rustore.ru/individual/multi-api-key)

1. **Разработчик** → **API RuStore** → **Создать ключ**.
2. Скопируйте **приватный ключ** сразу (больше не покажут).
3. Запишите **числовой keyId** из таблицы.
4. Локально:

```bash
cp deploy/rustore.env.example deploy/rustore.env
# вписать RUSTORE_KEY_ID и RUSTORE_PRIVATE_KEY
npm run rustore:auth
```

Первая версия приложения всё равно загружается **вручную** через консоль. API — для следующих релизов.

Документация API: [авторизация](https://www.rustore.ru/help/work-with-rustore-api/api-authorization-token)

## 3. Сборка для RuStore

```bash
npm run build:rustore
```

Получите:

| Файл | Назначение |
|------|------------|
| `artifacts/rustore/nagaevomaster-X.Y.Z.apk` | Загрузить в консоль (проще всего) |
| `artifacts/rustore/nagaevomaster-X.Y.Z.aab` | Меньший размер у пользователей (опционально) |
| `artifacts/rustore/upload-certificate.pem` | Сертификат подписи (для AAB / проверки) |

Требования RuStore к APK:

- package name: `ru.nagaevomaster.app`
- подпись тем же keystore, что и прошлые версии (`android/nagaevomaster-release.keystore`)
- `versionCode` больше предыдущего

## 4. Создать приложение в консоли

1. **Приложения** → **Добавить приложение** → название «Нагаево Мастер».
2. **Загрузить версию**.
3. Выберите **APK** (рекомендуется для первой публикации).
4. Загрузите файл из `artifacts/rustore/`.
5. Дождитесь обработки (не закрывайте страницу).

## 5. Карточка приложения

Подготовьте:

- Краткое описание (до 30 символов в названии в каталоге)
- Полное описание
- Иконка 512×512: `npm run android:icons` или `npm run rustore:assets` → `artifacts/rustore/store/icon-512.png` (**полный логотип** из `favicon.svg`, совпадает с APK)
- Скриншоты телефона (минимум 2)
- Категория: «Социальные» или «Бизнес»
- Контакты: email поддержки
- Политика конфиденциальности: `https://nagaevomaster.ru/privacy`
- Согласие на обработку ПДн: `https://nagaevomaster.ru/personal-data`
- Условия использования: `https://nagaevomaster.ru/terms`

Документы также доступны в приложении: **Регистрация** → ссылки и чекбокс; **Профиль** → раздел «Документы».

Отправьте на **модерацию**. Обычно 1–3 рабочих дня.

## 6. После одобрения

1. В `mobile/app-version.json` установите:

```json
"rustorePublished": true,
"rustoreUrl": "https://www.rustore.ru/catalog/app/ru.nagaevomaster.app"
```

2. Синхронизируйте и задеплойте сайт:

```bash
npm run version:sync
npm run build:hosting
npm run deploy:hosting
```

На странице `/app` появится кнопка **RuStore** (рекомендуемый способ установки).

Подключение бесплатных инструментов RuStore (Push, VK ID, VK Карты, Tracer): см. [`RUSTORE-TOOLS.md`](./RUSTORE-TOOLS.md).

## 7. Обновления

1. Увеличьте `versionCode` в `android/app/build.gradle`.
2. `npm run build:rustore`
3. Консоль → приложение → **Загрузить версию** → новый APK.
4. Заполните «Что нового» → модерация.

## Ссылки

- Каталог (после публикации): `https://www.rustore.ru/catalog/app/ru.nagaevomaster.app`
- Deeplink в приложении RuStore: `rustore://apps.rustore.ru/app/ru.nagaevomaster.app`
