/** Базовый URL API для OAuth: на проде через /api на основном домене (совпадает с callback). */
export function resolveOAuthApiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'nagaevomaster.ru' || host === 'www.nagaevomaster.ru' || host === 'localhost') {
      return '/api'
    }
  }
  const configured = import.meta.env.VITE_API_URL
  if (configured && String(configured).startsWith('http')) {
    return String(configured).replace(/\/$/, '')
  }
  return '/api'
}
