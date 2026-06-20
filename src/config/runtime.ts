/** Демо-данные только без удалённого API (локальная разработка / GitHub Pages) */
const HAS_REMOTE_API = Boolean(import.meta.env.VITE_API_URL?.startsWith('http'));
const USE_MOCK_FALLBACK = !HAS_REMOTE_API && (
    import.meta.env.VITE_USE_MOCK_FALLBACK === 'true' ||
    import.meta.env.DEV
);

export {
  USE_MOCK_FALLBACK,
  HAS_REMOTE_API,
}
