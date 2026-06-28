# GitFlic CI/CD → RuStore

Автоматическая сборка APK и загрузка черновика в [RuStore Console](https://console.rustore.ru).

Репозиторий GitFlic: https://gitflic.ru/project/impherion/nagaevo-master

Официальная инструкция: [GitFlic + RuStore](https://docs.gitflic.ru/cicd/rustore/) · [RuStore DevTools](https://www.rustore.ru/help/developers/tools/dev-tools/gitflic)

## Быстрый старт

1. **GitFlic** — зарегистрируйтесь, создайте компанию, перенесите или запушьте проект в `nagaevo-master`.
2. **Runner** — зарегистрируйте [GitFlic Agent](https://docs.gitflic.ru/cicd/runner/) на машине с:
   - Node.js 20+
   - JDK 21+
   - Android SDK (как для `npm run build:apk`)
3. **Переменные CI/CD** — скопируйте `deploy/gitflic-ci.env.example`, заполните в GitFlic → Настройки проекта → CI/CD.
4. **Первую версию** в RuStore всё равно загрузите вручную ([`RUSTORE.md`](./RUSTORE.md)) — дальше обновления из пайплайна.
5. Пуш в `main` → пайплайн **build:rustore** → вручную **deploy:rustore**.

## Переменные CI/CD

| Переменная | Назначение |
|------------|------------|
| `RS_KEY_ID` | Числовой ID ключа из RuStore Console → API RuStore |
| `RS_PRIVATE_KEY` | Приватный ключ (одной строкой, `\n` допустимы) |
| `ANDROID_KEYSTORE_BASE64` | Base64 файла `android/nagaevomaster-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Пароль keystore |
| `ANDROID_KEY_ALIAS` | `nagaevomaster` (по умолчанию) |
| `GOOGLE_SERVICES_JSON` | Содержимое `deploy/google-services.json` |
| `VK_MAPS_API_KEY` | Опционально, для карт в bundled APK |

Проверка ключа RuStore локально:

```bash
cp deploy/rustore.env.example deploy/rustore.env
# RUSTORE_KEY_ID + RUSTORE_PRIVATE_KEY
npm run rustore:auth
```

## Файлы в репозитории

| Файл | Роль |
|------|------|
| `gitflic-ci.yaml` | Пайплайн: сборка → деплой |
| `rustore-deploy.sh` | Метаданные версии + вызов API |
| `scripts/rustore/deploy.mjs` | RuStore Public API (черновик, APK, модерация) |
| `scripts/ci/prepare-android-ci.mjs` | Keystore и секреты на runner |

## Перед каждым релизом

1. Увеличьте `versionCode` в `android/app/build.gradle`.
2. Обновите `releaseNotes` в `mobile/app-version.json`.
3. При необходимости отредактируйте `rustore-deploy.sh` (`RUSTORE_WHATS_NEW`, описания).
4. Запушьте в `main`, дождитесь **build:rustore**, запустите **deploy:rustore**.

Локальная проверка сборки (без RuStore):

```bash
npm run build:rustore
```

Локальная проверка загрузки (нужен `deploy/rustore.env`):

```bash
npm run build:rustore
npm run rustore:deploy
```

## Подключение к GitFlic

Если код пока только на GitHub / локально:

```bash
git remote add gitflic https://gitflic.ru/project/impherion/nagaevo-master.git
git push -u gitflic main
```

Или импортируйте репозиторий в интерфейсе GitFlic.

## Ограничения RuStore

- Один активный черновик на приложение — удалите старый в консоли, если deploy падает.
- `versionCode` в APK должен быть больше опубликованного.
- Подпись APK — тем же keystore, что и предыдущие версии.

См. также: [`RUSTORE.md`](./RUSTORE.md) · [`README.md`](../README.md)
