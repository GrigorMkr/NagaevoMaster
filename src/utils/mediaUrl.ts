/** Абсолютный URL для /uploads с API-сервера */
import { PROD_API_ORIGIN, isSiteOrigin, resolveAbsoluteApiBase } from '@/utils/apiBase';
import { isNativeApp } from '@/utils/nativeApp';
import { ensureHttpsUrl } from '@/utils/secureUrl';

function resolveUploadUrl(path: string): string {
  if (!path || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('http')) {
    return ensureHttpsUrl(path);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Файлы пользователей хранятся на VPS, не на REG.RU
  if (typeof window !== 'undefined' && (isSiteOrigin() || isNativeApp())) {
    if (import.meta.env.PROD && window.location.hostname !== 'localhost') {
      return ensureHttpsUrl(`${PROD_API_ORIGIN}${normalizedPath}`);
    }
  }

  const apiBase = typeof window !== 'undefined'
    ? resolveAbsoluteApiBase()
    : (import.meta.env.VITE_API_URL ?? '/api');
  if (apiBase.startsWith('http')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return ensureHttpsUrl(`${origin}${normalizedPath}`);
  }
  return normalizedPath;
}

export {
  resolveUploadUrl,
}
