import { generateOAuthState } from '../../utils/pkce.js';

const TTL_MS = 10 * 60 * 1000;

interface OAuthPendingSession {
  provider: 'google' | 'vk';
  native: boolean;
  platform?: 'android' | 'ios';
  delivery?: 'webview' | 'cct';
  codeVerifier?: string;
  expiresAt: number;
}

const pendingSessions = new Map<string, OAuthPendingSession>();

function pruneExpiredPendingSessions() {
  const now = Date.now();
  for (const [state, entry] of pendingSessions) {
    if (entry.expiresAt <= now) {
      pendingSessions.delete(state);
    }
  }
}

function createOAuthPendingSession(options: {
  provider: 'google' | 'vk';
  native: boolean;
  platform?: 'android' | 'ios';
  delivery?: 'webview' | 'cct';
  codeVerifier?: string;
}): string {
  pruneExpiredPendingSessions();
  const state = generateOAuthState();
  pendingSessions.set(state, {
    provider: options.provider,
    native: options.native,
    platform: options.platform,
    delivery: options.delivery,
    codeVerifier: options.codeVerifier,
    expiresAt: Date.now() + TTL_MS,
  });
  return state;
}

function consumeOAuthPendingSession(
  state: string,
  provider: 'google' | 'vk',
): OAuthPendingSession | null {
  const entry = pendingSessions.get(state);
  pendingSessions.delete(state);
  if (!entry || entry.expiresAt <= Date.now() || entry.provider !== provider) {
    return null;
  }
  return entry;
}

export {
  createOAuthPendingSession,
  consumeOAuthPendingSession,
};
