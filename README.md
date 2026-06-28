# NagaevoMaster

Агрегатор услуг для Нагаево. Сайт: https://nagaevomaster.ru

## Установка

```bash
npm install
cd backend && npm install && cd ..
```

## Локальная разработка

**База (Docker, один раз):**

```bash
docker compose up -d
cd backend
cp .env.example .env    # если ещё нет .env
npm run db:setup
```

**Запуск (два терминала):**

```bash
# Терминал 1 — API
cd backend && npm run dev

# Терминал 2 — сайт
npm run dev
```

Сайт: http://localhost:3000 · API: http://localhost:4000/api/health

Тест: `admin@nagaevomaster.ru` / `admin123`

## Сборка

```bash
npm run build:hosting     # прод, base /
npm run build             # GitHub Pages
npm run preview
```

## Деплой

```bash
# Фронт на REG.RU (нужен deploy.env)
npm run build:hosting   
npm run deploy:hosting

# API на VPS
npm run vps:deploy
```

Версия и дата «последнего обновления» в футере обновляются автоматически при `build:hosting` (файл `site/site-version.json`).

Подробнее: [`deploy/VPS-REG.RU.md`](deploy/VPS-REG.RU.md) · [`deploy/HOSTING-SSL.md`](deploy/HOSTING-SSL.md)

## Android APK

```bash
npm run build:hosting
npm run android:env       # один раз
npm run build:apk         # → public/downloads/nagaevomaster.apk
npm run deploy:hosting
```

Подробнее: [`mobile/README.md`](mobile/README.md) · [`mobile/RUSTORE.md`](mobile/RUSTORE.md) · [`mobile/GITFLIC.md`](mobile/GITFLIC.md)

## Полезное

```bash
npm run lint
npm run test
npm run type-check
```

Backend: [`backend/README.md`](backend/README.md)
