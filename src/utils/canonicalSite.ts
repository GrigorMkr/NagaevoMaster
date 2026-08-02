import { SITE_URL } from '@/constants/app';
import { isGitHubPagesHost } from '@/utils/demoHost';
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

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function redirectToCanonicalHost(): void {
  if (typeof window === 'undefined' || isNativeApp() || isCanonicalHost()) return;
  // Portfolio / local demo hosts must stay on current origin
  if (isGitHubPagesHost() || isLocalDevHost()) return;
  const { pathname, search, hash } = window.location;
  window.location.replace(`${SITE_URL}${pathname}${search}${hash}`);
}

export {
  CANONICAL_HOST,
  getSiteOrigin,
  isCanonicalHost,
  redirectToCanonicalHost,
};
