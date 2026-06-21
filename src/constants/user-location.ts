const USER_LOCATION_STORAGE_KEY = 'nagaevomaster-account-location';
const LOCATION_PROMPT_FLAG_KEY = 'nagaevomaster-show-location-prompt';
const LOCATION_CONSENT_KEY = 'nagaevomaster-location-consent';
const PENDING_SEARCH_QUERY_KEY = 'nagaevomaster-pending-search-query';

type LocationConsent = 'accepted' | 'declined';

function requestLocationPromptAfterAuth() {
    sessionStorage.setItem(LOCATION_PROMPT_FLAG_KEY, '1');
}

function shouldShowLocationPrompt(): boolean {
    return sessionStorage.getItem(LOCATION_PROMPT_FLAG_KEY) === '1';
}

function clearLocationPromptFlag() {
    sessionStorage.removeItem(LOCATION_PROMPT_FLAG_KEY);
}

function getLocationConsent(): LocationConsent | null {
    const value = localStorage.getItem(LOCATION_CONSENT_KEY);
    if (value === 'accepted' || value === 'declined') {
        return value;
    }
    return null;
}

function setLocationConsentAccepted() {
    localStorage.setItem(LOCATION_CONSENT_KEY, 'accepted');
    clearLocationPromptFlag();
}

function setLocationConsentDeclined() {
    localStorage.setItem(LOCATION_CONSENT_KEY, 'declined');
    clearLocationPromptFlag();
}

function hasLocationConsentAccepted(): boolean {
    return getLocationConsent() === 'accepted';
}

function hasLocationConsentDeclined(): boolean {
    return getLocationConsent() === 'declined';
}

function savePendingSearchQuery(query: string) {
    const trimmed = query.trim();
    if (!trimmed)
        return;
    sessionStorage.setItem(PENDING_SEARCH_QUERY_KEY, trimmed);
}

function consumePendingSearchQuery(): string | null {
    const query = sessionStorage.getItem(PENDING_SEARCH_QUERY_KEY);
    if (query) {
        sessionStorage.removeItem(PENDING_SEARCH_QUERY_KEY);
    }
    return query;
}

function peekPendingSearchQuery(): string | null {
    return sessionStorage.getItem(PENDING_SEARCH_QUERY_KEY);
}

export {
  USER_LOCATION_STORAGE_KEY,
  LOCATION_PROMPT_FLAG_KEY,
  LOCATION_CONSENT_KEY,
  PENDING_SEARCH_QUERY_KEY,
  requestLocationPromptAfterAuth,
  shouldShowLocationPrompt,
  clearLocationPromptFlag,
  getLocationConsent,
  setLocationConsentAccepted,
  setLocationConsentDeclined,
  hasLocationConsentAccepted,
  hasLocationConsentDeclined,
  savePendingSearchQuery,
  consumePendingSearchQuery,
  peekPendingSearchQuery,
}

export type {
  LocationConsent,
}
