/** GitHub Pages и статическая сборка без API — демо-данные */
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true' ||
    (import.meta.env.PROD && !import.meta.env.VITE_API_URL);

export {
  USE_MOCK_FALLBACK,
}
