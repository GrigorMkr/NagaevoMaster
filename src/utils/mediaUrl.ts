/** Абсолютный URL для /uploads с API-сервера */
import { PROD_API_ORIGIN, resolveAbsoluteApiBase } from '@/utils/apiBase';
import { isNativeApp } from '@/utils/nativeApp';
import { ensureHttpsUrl } from '@/utils/secureUrl';

function resolveUploadUrl(path: string): string {
  if (!path || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('http')) {
    return ensureHttpsUrl(path);
  }
  const apiBase = typeof window !== 'undefined'
    ? resolveAbsoluteApiBase()
    : (import.meta.env.VITE_API_URL ?? '/api');
  if (apiBase.startsWith('http')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return ensureHttpsUrl(`${origin}${path.startsWith('/') ? path : `/${path}`}`);
  }
  if (isNativeApp()) {
    const apiBase = resolveAbsoluteApiBase();
    if (apiBase.startsWith('http')) {
      const origin = apiBase.replace(/\/api\/?$/, '');
      return ensureHttpsUrl(`${origin}${path.startsWith('/') ? path : `/${path}`}`);
    }
    return ensureHttpsUrl(`${PROD_API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`);
  }
  return path;
}

export {
  resolveUploadUrl,
}
