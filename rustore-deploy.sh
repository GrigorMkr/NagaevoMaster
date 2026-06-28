#!/usr/bin/env bash
# RuStore: метаданные версии и загрузка APK через Public API.
# Документация: mobile/GITFLIC.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# --- Метаданные карточки (редактируйте перед релизом) ---
export RUSTORE_PACKAGE_NAME="${RUSTORE_PACKAGE_NAME:-ru.nagaevomaster.app}"
export RUSTORE_APP_NAME="${RUSTORE_APP_NAME:-НМ}"
export RUSTORE_APP_TYPE="${RUSTORE_APP_TYPE:-MAIN}"
export RUSTORE_CATEGORIES="${RUSTORE_CATEGORIES:-[\"social\"]}"
export RUSTORE_AGE_LEGAL="${RUSTORE_AGE_LEGAL:-12+}"
export RUSTORE_SHORT_DESCRIPTION="${RUSTORE_SHORT_DESCRIPTION:-Портал Нагаево: мастера и объявления}"
export RUSTORE_FULL_DESCRIPTION="${RUSTORE_FULL_DESCRIPTION:-Нагаево Мастер — бесплатный портал посёлка: поиск мастеров, доска объявлений, переписка, форум и сообщества для жителей Нагаево.}"
export RUSTORE_MODER_INFO="${RUSTORE_MODER_INFO:-Обновление Android-приложения nagaevomaster.ru}"
export RUSTORE_PUBLISH_TYPE="${RUSTORE_PUBLISH_TYPE:-INSTANTLY}"
export RUSTORE_PRICE_VALUE="${RUSTORE_PRICE_VALUE:-0}"
export RUSTORE_SUBMIT_FOR_MODERATION="${RUSTORE_SUBMIT_FOR_MODERATION:-true}"

# Что нового — из mobile/app-version.json, если не задано вручную:
# export RUSTORE_WHATS_NEW="Пункт 1\nПункт 2"

# --- Ключи RuStore API (GitFlic → CI/CD → Переменные) ---
export RUSTORE_KEY_ID="${RS_KEY_ID:-${KEY_ID:-${RUSTORE_KEY_ID:-}}}"
export RUSTORE_PRIVATE_KEY="${RS_PRIVATE_KEY:-${PRIVATE_KEY:-${RUSTORE_PRIVATE_KEY:-}}}"

if [[ -z "${RUSTORE_KEY_ID}" || -z "${RUSTORE_PRIVATE_KEY}" ]]; then
  echo "Задайте RS_KEY_ID и RS_PRIVATE_KEY в настройках CI/CD GitFlic."
  echo "Ключ: https://console.rustore.ru → API RuStore"
  exit 1
fi

node scripts/rustore/deploy.mjs
