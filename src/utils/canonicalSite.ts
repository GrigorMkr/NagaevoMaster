import { SITE_URL } from '@/constants/app';
import { isNativeApp } from '@/utils/nativeApp';

const CANONICAL_HOST = new URL(SITE_URL).hostname;

function getSiteOrigin(): string {
  if (typeof window === 'undefined') return SITE_URL;
  return window.location.origin;
}

function isCanonicalHost(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === CANONICAL_HOST;
}

function redirectToCanonicalHost(): void {
  if (typeof window === 'undefined' || isNativeApp() || isCanonicalHost()) return;
  const { pathname, search, hash } = window.location;
  window.location.replace(`${SITE_URL}${pathname}${search}${hash}`);
}

export {
  CANONICAL_HOST,
  getSiteOrigin,
  isCanonicalHost,
  redirectToCanonicalHost,
};
