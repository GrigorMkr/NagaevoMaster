# NagaevoMaster API

REST API для агрегатора услуг Нагаево.

## Стек

- Node.js + Express 5 + TypeScript
- Prisma + SQLite (для продакшена можно PostgreSQL)
- JWT авторизация
- Multer для загрузки изображений

## Быстрый старт

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

API: http://localhost:4000/api/health

## Тестовые аккаунты (после seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | admin@nagaevomaster.ru | admin123 |
| Пользователь | demo@nagaevomaster.ru | master123 |
| Мастера | master1@nagaevomaster.ru … | master123 |

## Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Проверка сервера |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/recovery` | Восстановление пароля |
| GET | `/api/auth/me` | Текущий пользователь |
| GET | `/api/listings` | Каталог с фильтрами |
| GET | `/api/listings/:id` | Объявление |
| POST | `/api/listings` | Создать объявление |
| GET | `/api/listings/:id/reviews` | Отзывы |
| POST | `/api/listings/:id/reviews` | Оставить отзыв |
| POST | `/api/listings/:id/report` | Жалоба |
| GET/POST/DELETE | `/api/favorites/:listingId` | Избранное |
| GET/POST | `/api/forum/topics` | Форум |
| GET | `/api/forum/topics/:id` | Тема с ответами |
| POST | `/api/forum/topics/:id/replies` | Ответ в теме |
| POST | `/api/contact` | Обратная связь |
| POST | `/api/uploads` | Загрузка фото |

## Запуск с фронтендом

Терминал 1 — API:

```bash
cd backend && npm run dev
```

Терминал 2 — фронтенд:

```bash
npm run dev
```

Фронтенд проксирует `/api` и `/uploads` на порт 4000.

## Продакшен

1. Замените `DATABASE_URL` на PostgreSQL
2. Смените `JWT_SECRET`
3. Настройте `CORS_ORIGIN` на домен фронтенда
4. Разверните API на VPS (Railway, Render, Timeweb и т.д.)
5. Укажите `VITE_API_URL=https://api.ваш-домен.ru` при сборке фронтенда
