# Мобильное приложение «Нагаево Мастер»

Нативная оболочка на [Capacitor](https://capacitorjs.com/) — внутри загружается сайт `https://nagaevomaster.ru` с push-уведомлениями и иконкой на рабочем столе.

## Android (APK)

1. Установите [Android Studio](https://developer.android.com/studio).
2. В корне проекта:
   ```bash
   npm run build:hosting
   npx cap sync android
   npm run build:apk
   ```
3. APK появится в `public/downloads/nagaevomaster.apk` — его скачивают с страницы `/app`.
4. Для Google Play: подпишите AAB в Android Studio → Release → Generate Signed Bundle.

## iOS (App Store)

Требуется Mac с Xcode.

```bash
npm run build:hosting
npx cap sync ios
npx cap open ios
```

В Xcode: Product → Archive → Distribute App → App Store Connect.

Обновите `MOBILE_APP_APP_STORE_URL` в `src/constants/mobileApp.ts` после публикации.

## Переменные

| Переменная | Назначение |
|------------|------------|
| `CAPACITOR_SERVER_URL` | URL сайта в WebView (по умолчанию `https://nagaevomaster.ru`) |

## Размер APK

Приложение загружает сайт с `https://nagaevomaster.ru` — в APK кладётся только лёгкая оболочка (`mobile/capacitor-shell`), не весь `dist`. Иначе файл раздувается до ~120 МБ (сайт + картинки + старый APK внутри).

Сборка: `npm run build:apk` → обычно **~3 МБ**.

## Push-уведомления (Android)

Для push в приложении нужны **Firebase** и ключ на сервере:

1. [Firebase Console](https://console.firebase.google.com/) → создайте проект → добавьте Android-приложение с ID `ru.nagaevomaster.app`.
2. Скачайте `google-services.json` → положите в `android/app/google-services.json`.
3. Firebase → Project settings → Cloud Messaging → скопируйте **Server key**.
4. Добавьте в `deploy/push.env`: `FCM_SERVER_KEY=...` и выполните `npm run vps:push`.
5. Пересоберите APK: `npm run build:apk` и выложите на сайт.

Без `google-services.json` push в APK не заработает. Скрипт `npm run build:apk` **отключает** нативный push-плагин, если файла нет — иначе приложение может сразу закрываться при запуске.

## ID приложения

`ru.nagaevomaster.app` — используйте тот же в Play Console и App Store Connect.
