const NATIVE_SCHEME = 'ru.nagaevomaster.app';
const ANDROID_PACKAGE = 'ru.nagaevomaster.app';

const OAUTH_RETURN_PATH_KEY = 'nagaevo:oauth_return_path';

function writeStoredOAuthReturnPath(path: string) {
  try {
    localStorage.setItem(OAUTH_RETURN_PATH_KEY, path);
  } catch {
    // ignore
  }
}

function readStoredOAuthReturnPath(): string | null {
  try {
    const stored = localStorage.getItem(OAUTH_RETURN_PATH_KEY);
    localStorage.removeItem(OAUTH_RETURN_PATH_KEY);
    if (stored && stored.startsWith('/') && !stored.startsWith('//')) {
      return stored;
    }
  } catch {
    // ignore
  }
  return null;
}

const SITE_HOST = 'nagaevomaster.ru';

function buildNativeOAuthReturnUrls(search: string) {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const suffix = query ? `?${query}` : '';
  const customScheme = `${NATIVE_SCHEME}://auth${suffix}`;
  const httpsFallback = `https://${SITE_HOST}/auth/app-return${suffix}`;
  const appLink = customScheme;
  const intentUrl =
    `intent://auth${suffix}#Intent;scheme=${NATIVE_SCHEME};package=${ANDROID_PACKAGE};`
    + `S.browser_fallback_url=${encodeURIComponent(httpsFallback)};end`;

  return {
    customScheme,
    intentUrl,
    httpsFallback,
    appLink,
  };
}

export {
  NATIVE_SCHEME,
  ANDROID_PACKAGE,
  OAUTH_RETURN_PATH_KEY,
  buildNativeOAuthReturnUrls,
  writeStoredOAuthReturnPath,
  readStoredOAuthReturnPath,
};
