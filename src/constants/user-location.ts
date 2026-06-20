const USER_LOCATION_STORAGE_KEY = 'nagaevomaster-account-location';
const LOCATION_PROMPT_FLAG_KEY = 'nagaevomaster-show-location-prompt';
const PENDING_SEARCH_QUERY_KEY = 'nagaevomaster-pending-search-query';

function requestLocationPromptAfterAuth() {
    sessionStorage.setItem(LOCATION_PROMPT_FLAG_KEY, '1');
}

function shouldShowLocationPrompt(): boolean {
    return sessionStorage.getItem(LOCATION_PROMPT_FLAG_KEY) === '1';
}

function clearLocationPromptFlag() {
    sessionStorage.removeItem(LOCATION_PROMPT_FLAG_KEY);
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
  PENDING_SEARCH_QUERY_KEY,
  requestLocationPromptAfterAuth,
  shouldShowLocationPrompt,
  clearLocationPromptFlag,
  savePendingSearchQuery,
  consumePendingSearchQuery,
  peekPendingSearchQuery,
}
