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
npm run build
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

## Переменные окружения

Скопируйте `.env.example` в `.env`:

```
VITE_API_BASE_URL=/api
```
