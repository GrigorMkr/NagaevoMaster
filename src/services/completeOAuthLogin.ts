import toast from 'react-hot-toast';
import { store } from '@/app/store';
import { setUser } from '@/features/user/userSlice';
import { ROUTES } from '@/constants';
import {
  exchangeOAuthCode,
  exchangeOAuthHandoff,
  fetchCurrentUser,
  saveAuthToken,
} from '@/services/authApi';
import { ensurePushNotifications } from '@/services/pushApi';
import { readStoredOAuthReturnPath } from '@/utils/nativeOAuthReturn';
import { isSiteOrigin } from '@/utils/apiBase';
import { isNativeApp } from '@/utils/nativeApp';
import {
  clearOAuthPending,
  normalizeOAuthSearch,
  readOAuthPending,
  stashOAuthPending,
} from '@/utils/oauthPending';
import { getErrorMessage } from '@/utils/errorMessage';

type OAuthLoginResult =
  | { status: 'none' }
  | { status: 'pending' }
  | { status: 'success'; returnPath: string }
  | { status: 'error'; message: string };

const inflightByKey = new Map<string, Promise<OAuthLoginResult>>();

function parseOAuthSearch(search: string) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return {
    oauth: params.get('oauth'),
    code: params.get('code'),
    handoff: params.get('handoff'),
    oauthError: params.get('oauth_error'),
  };
}

function resolveReturnPath(): string {
  return readStoredOAuthReturnPath() ?? ROUTES.PROFILE;
}

function resolveEffectiveOAuthSearch(search: string): string {
  const normalized = normalizeOAuthSearch(search);
  const { oauth, code, handoff, oauthError } = parseOAuthSearch(normalized);
  if (oauthError || handoff || (oauth === '1' && code)) {
    return normalized;
  }
  const pending = readOAuthPending();
  return pending ?? normalized;
}

function getInflightKey(search: string): string | null {
  const { code, handoff, oauthError } = parseOAuthSearch(search);
  if (oauthError) return `error:${oauthError}`;
  if (handoff) return `handoff:${handoff}`;
  if (code) return `code:${code}`;
  return null;
}

function ensureNativeOAuthLanding(search: string): boolean {
  if (!isNativeApp()) {
    return true;
  }

  const normalized = normalizeOAuthSearch(search);
  if (isSiteOrigin() || window.location.pathname === '/auth/app-return') {
    return true;
  }

  stashOAuthPending(normalized);
  window.history.replaceState(window.history.state, '', `/auth/app-return${normalized}`);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
  return false;
}

async function completeOAuthLogin(search: string): Promise<OAuthLoginResult> {
  const effectiveSearch = resolveEffectiveOAuthSearch(search);
  const { oauth, code, handoff, oauthError } = parseOAuthSearch(effectiveSearch);

  if (oauthError) {
    clearOAuthPending();
    return { status: 'error', message: decodeURIComponent(oauthError) };
  }

  if (!handoff && (oauth !== '1' || !code)) {
    return { status: 'none' };
  }

  const inflightKey = getInflightKey(effectiveSearch);
  if (!inflightKey) {
    return { status: 'none' };
  }

  const existing = inflightByKey.get(inflightKey);
  if (existing) {
    return existing;
  }

  if (!handoff && !ensureNativeOAuthLanding(effectiveSearch)) {
    return { status: 'pending' };
  }

  const promise = (async (): Promise<OAuthLoginResult> => {
    try {
      const token = handoff
        ? await exchangeOAuthHandoff(handoff)
        : await exchangeOAuthCode(code!);
      saveAuthToken(token);
      const user = await fetchCurrentUser();
      store.dispatch(setUser(user));
      clearOAuthPending();
      void ensurePushNotifications({ requestPermission: true });
      toast.success(`Добро пожаловать, ${user.name}!`);
      return { status: 'success', returnPath: resolveReturnPath() };
    } catch (error) {
      return {
        status: 'error',
        message: getErrorMessage(error, 'Не удалось завершить вход'),
      };
    } finally {
      inflightByKey.delete(inflightKey);
    }
  })();

  inflightByKey.set(inflightKey, promise);
  return promise;
}

function getOAuthSearchFromUrl(url: URL): string | null {
  const { oauth, code, oauthError } = parseOAuthSearch(url.search);
  if (oauthError) {
    return url.search;
  }
  if (oauth === '1' && code) {
    return url.search;
  }
  return null;
}

function getNativeOAuthSearchFromUrl(url: URL): string | null {
  const handoff = url.searchParams.get('handoff');
  if (handoff) {
    return `?handoff=${encodeURIComponent(handoff)}`;
  }
  return getOAuthSearchFromUrl(url);
}

function isOAuthReturnPath(pathname: string): boolean {
  return pathname === '/auth/app-return'
    || pathname === '/native-oauth-bridge.html'
    || pathname === '/auth';
}

function hasNativeOAuthParams(search: string): boolean {
  const { oauth, code, handoff, oauthError } = parseOAuthSearch(search);
  return Boolean(oauthError || handoff || (oauth === '1' && code));
}

export {
  completeOAuthLogin,
  getOAuthSearchFromUrl,
  getNativeOAuthSearchFromUrl,
  hasNativeOAuthParams,
  isOAuthReturnPath,
  parseOAuthSearch,
};

export type {
  OAuthLoginResult,
};
