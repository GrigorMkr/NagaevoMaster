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

1. `google-services.json` → `android/app/`
2. `FCM_SERVER_KEY` в `deploy/push.env` → `npm run vps:push`
3. Пересобрать APK

ID приложения: `ru.nagaevomaster.app`
