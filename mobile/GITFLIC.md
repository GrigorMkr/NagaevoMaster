# GitFlic CI/CD → RuStore

Автоматическая сборка APK и загрузка черновика в [RuStore Console](https://console.rustore.ru).

**Рабочий репозиторий CI:** https://gitflic.ru/project/nagaevomaster/nagaevo-master  
**Компания:** `nagaevomaster` · **Runner:** локальный агент на вашем ПК

Официальная инструкция: [GitFlic + RuStore](https://docs.gitflic.ru/cicd/rustore/) · [RuStore DevTools](https://www.rustore.ru/help/developers/tools/dev-tools/gitflic)

## Автонастройка (одной командой)

```bash
# 1. deploy/gitflic.env — GITFLIC_TOKEN из профиля GitFlic
cp deploy/gitflic.env.example deploy/gitflic.env

# 2. Создаёт компанию (если нет), runner, JSON переменных, запускает пайплайн
npm run gitflic:setup
```

Скрипт `scripts/ci/setup-gitflic.mjs`:

- собирает секреты из `android/keystore.properties`, `deploy/google-services.json`, `deploy/vkmaps.env`, `deploy/rustore.env`;
- пишет `artifacts/gitflic/ci-variables-upload.json` для загрузки в UI;
- регистрирует [GitFlic Runner](https://docs.gitflic.ru/cicd/runner/) в `%USERPROFILE%\gitflic-runner`;
- запускает пайплайн с переменными (если API не принимает POST для переменных).

**Runner должен быть запущен** (окно PowerShell с `java -jar runner.jar start`). После перезагрузки ПК:

```powershell
cd $env:USERPROFILE\gitflic-runner
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot"  # или ваш JDK 21+
& "$env:JAVA_HOME\bin\java.exe" -jar runner.jar start --config=config/application.properties
```

## Быстрый старт (вручную)

1. **Компания** — на gitflic.ru runner работает только на уровне компании ([документация](https://docs.gitflic.ru/cicd/agent/)). Проект должен быть в компании: `nagaevomaster/nagaevo-master`.
2. **Runner** — Node 20+, JDK 21+, Android SDK (`%LOCALAPPDATA%\Android\Sdk`).
3. **Переменные CI/CD** — GitFlic → [Настройки проекта → CI/CD](https://gitflic.ru/project/nagaevomaster/nagaevo-master/setting/cicd) → загрузить `artifacts/gitflic/ci-variables-upload.json`.
4. **Первую версию** в RuStore загрузите вручную ([`RUSTORE.md`](./RUSTORE.md)).
5. Пуш в `main` → **build:rustore** → вручную **deploy:rustore**.

```bash
npm run gitflic:pipeline   # запуск пайплайна через API
```

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
| `scripts/ci/setup-gitflic.mjs` | Автонастройка runner + переменные |
| `scripts/ci/trigger-gitflic-pipeline.mjs` | Запуск пайплайна через API |

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

Remotes:

```bash
git remote add gitflic-company https://gitflic.ru/project/nagaevomaster/nagaevo-master.git
git push -u gitflic-company main
```

Старый remote пользователя (если был): `https://gitflic.ru/project/impherion/nagaevo-master.git`

## Ограничения RuStore

- Один активный черновик на приложение — удалите старый в консоли, если deploy падает.
- `versionCode` в APK должен быть больше опубликованного.
- Подпись APK — тем же keystore, что и предыдущие версии.

См. также: [`RUSTORE.md`](./RUSTORE.md) · [`README.md`](../README.md)
