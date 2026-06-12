import { APP_NAME, CONTACT_EMAIL, GEO } from '@/constants';
const PREVIEW_STORAGE_KEY = 'nagaevomaster-preview-access';
const SITE_CLOSED = import.meta.env.VITE_SITE_CLOSED === 'true';
const PREVIEW_ACCESS_KEY = import.meta.env.VITE_PREVIEW_ACCESS_KEY ?? 'nagaevo-preview';
function isSiteOpenForUser(): boolean {
    if (!SITE_CLOSED)
        return true;
    if (!import.meta.env.PROD)
        return true;
    try {
        return localStorage.getItem(PREVIEW_STORAGE_KEY) === 'granted';
    }
    catch {
        return false;
    }
}
function normalizeAccessKey(value: string): string {
    return value.trim().toLowerCase();
}
function grantPreviewAccess(key: string): boolean {
    if (normalizeAccessKey(key) !== normalizeAccessKey(PREVIEW_ACCESS_KEY))
        return false;
    try {
        localStorage.setItem(PREVIEW_STORAGE_KEY, 'granted');
    }
    catch {
        return false;
    }
    return true;
}
function revokePreviewAccess(): void {
    try {
        localStorage.removeItem(PREVIEW_STORAGE_KEY);
    }
    catch {
        // ignore
    }
}
function applyPreviewAccessFromUrl(): boolean {
    const params = new URLSearchParams(window.location.search);
    const preview = params.get('preview');
    if (!preview)
        return false;
    const granted = grantPreviewAccess(preview);
    if (!granted)
        return false;
    params.delete('preview');
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
    return true;
}
const COMING_SOON_COPY = {
    title: 'Сайт в разработке',
    subtitle: `Скоро запустим ${APP_NAME} — агрегатор услуг для посёлка ${GEO.settlement} и окрестностей.`,
    hint: 'Сейчас мы дорабатываем каталог, форум и личный кабинет. Загляните чуть позже.',
    contactLabel: CONTACT_EMAIL,
} as const;

export {
  SITE_CLOSED,
  isSiteOpenForUser,
  grantPreviewAccess,
  revokePreviewAccess,
  applyPreviewAccessFromUrl,
  COMING_SOON_COPY,
}
