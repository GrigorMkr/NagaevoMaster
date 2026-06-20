# NagaevoMaster

Агрегатор услуг и форум для поселка Нагаево и окрестностей (радиус до 50 км).

## Стек

- React 19 + TypeScript (strict)
- Vite
- React Router DOM
- Redux Toolkit
- Axios
- Leaflet + React-Leaflet
- React Helmet Async
- CSS Modules + classnames
- React Hook Form + Zod
- React Hot Toast
- date-fns

## Запуск

```bash
npm install
npm run dev
```

Приложение откроется на http://localhost:3000

## Сборка

```bash
npm run build          # GitHub Pages (/NagaevoMaster/)
npm run build:hosting  # свой домен (REG.RU), base /
npm run preview
```

## Структура

```
src/
├── app/           # Redux store, providers, hooks
├── components/    # UI и layout
├── features/      # Redux slices по доменам
├── pages/         # Страницы SPA
├── routes/        # Маршрутизация
├── services/      # API (Axios)
├── styles/        # Глобальные стили
├── types/         # TypeScript типы
└── utils/         # Константы и утилиты
```

## Backend API

Полный REST API в папке `backend/`. См. [backend/README.md](backend/README.md).

```bash
# Терминал 1 — API
cd backend && npm install && npm run db:setup && npm run dev

# Терминал 2 — фронтенд
npm run dev
```

## Переменные окружения

Скопируйте `.env.example` в `.env`:

```
VITE_API_URL=/api
```

Для GitHub Pages без сервера: `VITE_USE_MOCK_FALLBACK=true`

## Деплой на REG.RU (свой домен)

### 1. Сборка

```bash
cp .env.production.example .env.production   # при необходимости отредактируйте
npm run build:hosting
npm run package:hosting   # создаст nagaevo-hosting.zip
```

### 2. Загрузка на хостинг

**Вариант A — архив:** ISPmanager → Менеджер файлов → папка сайта (`www/домен.ru/data`) → распакуйте содержимое `nagaevo-hosting.zip`.

**Вариант B — FTP:**

```bash
cp deploy.env.example deploy.env   # FTP из ISPmanager → FTP-пользователи
npm run deploy:hosting
```

### 3. SSL

ISPmanager → WWW-домены → ваш домен → Let's Encrypt.

Подробнее для **DomainSSL (GlobalSign)**: [`deploy/HOSTING-SSL.md`](deploy/HOSTING-SSL.md)

```powershell
node scripts/prepare-hosting-ssl.mjs   # собрать .crt/.key для панели
```

### 4. Backend (VPS REG.RU)

На виртуальном хостинге Node.js не запускается. API разворачивается на **VPS REG.RU**:

```bash
# На VPS (Ubuntu 22.04), после заказа и A-записи api → IP:
curl -fsSL https://raw.githubusercontent.com/GrigorMkr/NagaevoMaster/main/scripts/vps/install.sh | sudo bash
```

Полная инструкция: [`deploy/VPS-REG.RU.md`](deploy/VPS-REG.RU.md)

**Email/SMS при регистрации:** [`deploy/NOTIFY.md`](deploy/NOTIFY.md)

После запуска API пересоберите фронт: `npm run build:hosting && npm run deploy:hosting`

## GitHub Pages

Демо: https://grigormkr.github.io/NagaevoMaster/

Деплой автоматический при push в `main` (workflow `deploy.yml`).
