/** Абсолютный URL для /uploads с API-сервера */
function resolveUploadUrl(path: string): string {
  if (!path || path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }
  const apiBase = import.meta.env.VITE_API_URL ?? '/api';
  if (apiBase.startsWith('http')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

export {
  resolveUploadUrl,
}
