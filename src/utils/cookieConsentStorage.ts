import { COOKIE_CONSENT_STORAGE_KEY } from '@/constants/cookie-consent';

const COOKIE_NAME = 'nm_cookie_consent';
const CONSENT_MAX_AGE_SEC = 365 * 24 * 60 * 60;

interface CookieConsentRecord {
  version: 1;
  essential: true;
  analytics: true;
  acceptedAt: string;
}

function parseConsent(raw: string | null): CookieConsentRecord | null {
  if (!raw) {
    return null;
  }
  if (raw === 'accepted') {
    return {
      version: 1,
      essential: true,
      analytics: true,
      acceptedAt: new Date(0).toISOString(),
    };
  }
  try {
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (parsed.version === 1 && parsed.acceptedAt) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function readCookieValue(): string | null {
  const prefix = `${COOKIE_NAME}=`;
  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) {
    return null;
  }
  return decodeURIComponent(entry.slice(prefix.length));
}

function readStoredConsent(): CookieConsentRecord | null {
  try {
    const fromStorage = parseConsent(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
    if (fromStorage) {
      return fromStorage;
    }
  } catch {
    // localStorage unavailable
  }
  return parseConsent(readCookieValue());
}

function saveCookieConsent(): CookieConsentRecord {
  const record: CookieConsentRecord = {
    version: 1,
    essential: true,
    analytics: true,
    acceptedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(record);
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, serialized);
  } catch {
    // localStorage may be unavailable
  }
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)};path=/;max-age=${CONSENT_MAX_AGE_SEC};SameSite=Lax`;
  return record;
}

function hasCookieConsent(): boolean {
  return readStoredConsent() !== null;
}

export type {
  CookieConsentRecord,
};

export {
  hasCookieConsent,
  readStoredConsent,
  saveCookieConsent,
};
