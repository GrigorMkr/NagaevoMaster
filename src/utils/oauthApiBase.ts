/** Базовый URL API для OAuth: на проде через /api на основном домене (совпадает с callback). */
import { PROD_API_ORIGIN } from '@/utils/apiBase';
import { isNativeApp } from '@/utils/nativeApp';

export function resolveOAuthApiBase(): string {
  if (typeof window !== 'undefined' && isNativeApp()) {
    return `${PROD_API_ORIGIN}/api`;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'nagaevomaster.ru' || host === 'www.nagaevomaster.ru') {
      return `${PROD_API_ORIGIN}/api`
    }
    if (host === 'localhost') {
      return '/api'
    }
  }
  const configured = import.meta.env.VITE_API_URL
  if (configured && String(configured).startsWith('http')) {
    return String(configured).replace(/\/$/, '')
  }
  return '/api'
}
