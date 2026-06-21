const OAUTH_PENDING_KEY = 'nagaevo:oauth_pending';

function normalizeOAuthSearch(search: string): string {
  return search.startsWith('?') ? search : `?${search}`;
}

function stashOAuthPending(search: string) {
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, normalizeOAuthSearch(search));
  } catch {
    // ignore
  }
}

function readOAuthPending(): string | null {
  try {
    return sessionStorage.getItem(OAUTH_PENDING_KEY);
  } catch {
    return null;
  }
}

function clearOAuthPending() {
  try {
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
  } catch {
    // ignore
  }
}

export {
  normalizeOAuthSearch,
  stashOAuthPending,
  readOAuthPending,
  clearOAuthPending,
};
