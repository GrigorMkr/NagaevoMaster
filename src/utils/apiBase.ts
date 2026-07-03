import { isNativeApp } from '@/utils/nativeApp';

const SITE_ORIGIN = 'https://nagaevomaster.ru';
const PROD_API_ORIGIN = 'https://api.nagaevomaster.ru';

function isSiteOrigin(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'nagaevomaster.ru' || host === 'www.nagaevomaster.ru' || host === 'localhost';
}

function resolveAbsoluteApiBase(): string {
  if (typeof window !== 'undefined' && isNativeApp()) {
    return `${PROD_API_ORIGIN}/api`;
  }
  if (typeof window !== 'undefined' && isSiteOrigin()) {
    return `${window.location.origin}/api`;
  }
  const configured = import.meta.env.VITE_API_URL;
  if (configured && String(configured).startsWith('http')) {
    return String(configured).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
}

export {
  SITE_ORIGIN,
  PROD_API_ORIGIN,
  isSiteOrigin,
  resolveAbsoluteApiBase,
};
