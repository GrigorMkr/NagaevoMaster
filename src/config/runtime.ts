/** Демо-данные только без удалённого API (локальная разработка / GitHub Pages) */
const HAS_REMOTE_API = Boolean(import.meta.env.VITE_API_URL?.startsWith('http'));
const USE_MOCK_FALLBACK = !HAS_REMOTE_API && (
    import.meta.env.VITE_USE_MOCK_FALLBACK === 'true' ||
    import.meta.env.DEV
);
/** Пробовать localhost:4000 в dev (иначе сразу демо-данные без proxy-ошибок) */
const TRY_LOCAL_API = import.meta.env.VITE_TRY_LOCAL_API === 'true';

export {
  USE_MOCK_FALLBACK,
  HAS_REMOTE_API,
  TRY_LOCAL_API,
}
