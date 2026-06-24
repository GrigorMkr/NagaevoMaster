# Мобильное приложение

Capacitor-оболочка, внутри открывается https://nagaevomaster.ru

## Android

```bash
npm run build:hosting
npm run android:env       # один раз: JDK + Android SDK
npm run build:apk         # APK → public/downloads/nagaevomaster.apk
```

Версия на странице `/app` берётся из `mobile/app-version.json` (синхронизируется из `android/app/build.gradle`):

```bash
npm run version:sync      # вручную
# при build:apk — автоматически, с датой релиза
```

Перед релизом допишите пункты в `releaseNotes` в `mobile/app-version.json`.

```bash
npm run deploy:hosting
```

Открыть в Android Studio:

```bash
npm run cap:sync:android
npm run cap:android
```

## iOS (Mac + Xcode)

```bash
npm run build:hosting
npx cap sync ios
npm run cap:ios
```

## Push (Android)

1. Один раз: `npx firebase login`
2. `npm run android:firebase` — `google-services.json` для APK
3. `npm run fcm:setup` — сервисный аккаунт FCM v1 для API
4. `npm run vps:push` — ключи на VPS
5. `npm run build:apk`

Файлы `deploy/google-services.json`, `deploy/firebase-service-account.json` в git не попадают.

ID приложения: `ru.nagaevomaster.app`
