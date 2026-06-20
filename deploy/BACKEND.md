# Деплой API на Render (PostgreSQL + Node.js)

1. Откройте https://dashboard.render.com/blueprints
2. **New Blueprint Instance** → репозиторий `GrigorMkr/NagaevoMaster`
3. Render создаст `nagaevomaster-api` и БД `nagaevomaster-db`
4. Дождитесь статуса **Live** (5–10 мин)
5. Проверка: https://nagaevomaster-api.onrender.com/api/health

> Если сборка падает с ошибками `@types/*`: в Blueprint нажмите **Manual sync** после обновления `render.yaml` (build ставит devDependencies через `NPM_CONFIG_PRODUCTION=false`).

## Локальная разработка с PostgreSQL

```bash
docker compose up -d
cd backend && cp .env.example .env && npm install && npm run db:setup && npm run dev
```

## Переменные на Render (задаются в render.yaml)

| Переменная | Значение |
|------------|----------|
| `CORS_ORIGIN` | `https://nagaevomaster.ru,https://www.nagaevomaster.ru` |
| `DATABASE_URL` | из PostgreSQL Render |
| `JWT_SECRET` | генерируется автоматически |

## Фронтенд после деплоя API

```bash
npm run build:hosting
npm run deploy:hosting
```

В `.env.production`: `VITE_API_URL=https://nagaevomaster-api.onrender.com/api`

## Аккаунты после seed

- `admin@nagaevomaster.ru` / `admin123`
- `demo@nagaevomaster.ru` / `master123`

## VPS REG.RU (альтернатива)

См. `deploy/nginx.conf.example` и `deploy/pm2.ecosystem.cjs`.
