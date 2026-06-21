import { generateOAuthState } from './pkce.js';

const NATIVE_SUFFIX = '|n';

function createOAuthState(native: boolean): string {
  const state = generateOAuthState();
  return native ? `${state}${NATIVE_SUFFIX}` : state;
}

function parseOAuthState(raw: string | undefined): { state: string; native: boolean } {
  if (!raw) {
    return { state: '', native: false };
  }
  if (raw.endsWith(NATIVE_SUFFIX)) {
    return { state: raw.slice(0, -NATIVE_SUFFIX.length), native: true };
  }
  return { state: raw, native: false };
}

function isOAuthNativeFlow(reqNativeCookie: boolean, state?: string, savedState?: string): boolean {
  if (reqNativeCookie) return true;
  if (state && parseOAuthState(state).native) return true;
  if (savedState && parseOAuthState(savedState).native) return true;
  return false;
}

export {
  createOAuthState,
  parseOAuthState,
  isOAuthNativeFlow,
};
