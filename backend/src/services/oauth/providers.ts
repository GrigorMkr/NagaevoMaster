import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { createOAuthExchangeCode } from './exchange.js';
import { createOAuthHandoff } from './handoff.js';
import { toUserResponse } from '../../utils/mappers.js';

interface OAuthProfile {
  provider: 'google' | 'vk';
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

const NATIVE_APP_SCHEME = 'ru.nagaevomaster.app';

function oauthRedirect(path: string) {
  return `${env.SITE_URL.replace(/\/$/, '')}${path}`;
}

function nativeAppSchemeRedirect(query: string) {
  return `${NATIVE_APP_SCHEME}://auth?${query}`;
}

function shouldUseAndroidCctReturn(
  platform?: 'android' | 'ios',
  delivery?: 'webview' | 'cct',
): boolean {
  return platform === 'android' && delivery !== 'webview';
}

function nativeAppReturnRedirect(
  query: string,
  platform?: 'android' | 'ios',
  delivery?: 'webview' | 'cct',
) {
  if (shouldUseAndroidCctReturn(platform, delivery)) {
    return oauthRedirect(`/native-oauth-bridge.html?${query}`);
  }
  return oauthRedirect(`/auth/app-return?${query}`);
}

function buildAuthSuccessRedirect(
  token: string,
  native = false,
  platform?: 'android' | 'ios',
  delivery?: 'webview' | 'cct',
) {
  if (native) {
    const handoff = createOAuthHandoff(token);
    const query = `handoff=${encodeURIComponent(handoff)}`;
    return nativeAppReturnRedirect(query, platform, delivery);
  }
  const code = createOAuthExchangeCode(token);
  const qs = `oauth=1&code=${encodeURIComponent(code)}`;
  return oauthRedirect(`/auth?${qs}`);
}

function buildAuthErrorRedirect(
  message: string,
  native = false,
  platform?: 'android' | 'ios',
  delivery?: 'webview' | 'cct',
) {
  const qs = `oauth_error=${encodeURIComponent(message)}`;
  if (native) {
    return nativeAppReturnRedirect(qs, platform, delivery);
  }
  return oauthRedirect(`/auth?${qs}`);
}

async function findOrCreateOAuthUser(profile: OAuthProfile) {
  const email = profile.email.trim().toLowerCase();
  const googleField = profile.provider === 'google' ? { googleId: profile.providerId } : {};
  const vkField = profile.provider === 'vk' ? { vkId: profile.providerId } : {};

  const byProvider = await prisma.user.findFirst({
    where: profile.provider === 'google'
      ? { googleId: profile.providerId }
      : { vkId: profile.providerId },
  });
  if (byProvider) {
    return byProvider;
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        ...googleField,
        ...vkField,
        emailVerified: true,
        avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl,
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name: profile.name,
      passwordHash: await bcrypt.hash(randomUUID(), 10),
      emailVerified: true,
      avatarUrl: profile.avatarUrl,
      ...googleField,
      ...vkField,
    },
  }).then(async (user) => {
    const { sendWelcomeMessageToUser } = await import('../welcomeMessage.js');
    void sendWelcomeMessageToUser(user.id).catch(() => {});
    return user;
  });
}

async function exchangeGoogleCode(code: string): Promise<OAuthProfile> {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth не настроен');
  }

  const redirectUri = `${env.SITE_URL.replace(/\/$/, '')}/api/auth/google/callback`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error ?? 'Не удалось получить токен Google');
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json() as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!profile.id || !profile.email) {
    throw new Error('Google не вернул профиль');
  }

  return {
    provider: 'google',
    providerId: profile.id,
    email: profile.email,
    name: profile.name ?? profile.email.split('@')[0] ?? 'Пользователь',
    avatarUrl: profile.picture,
  };
}

async function exchangeVkCode(
  code: string,
  options?: { deviceId?: string; codeVerifier?: string; state?: string },
): Promise<OAuthProfile> {
  const clientId = env.VK_CLIENT_ID;
  const clientSecret = env.VK_CLIENT_SECRET;
  if (!clientId) {
    throw new Error('VK OAuth не настроен');
  }

  const redirectUri = `${env.SITE_URL.replace(/\/$/, '')}/api/auth/vk/callback`;

  if (options?.deviceId && options.codeVerifier) {
    return exchangeVkIdCode({
      code,
      deviceId: options.deviceId,
      codeVerifier: options.codeVerifier,
      state: options.state,
      clientId,
      clientSecret,
      redirectUri,
    });
  }

  if (!clientSecret) {
    throw new Error('VK OAuth: укажите защищённый ключ в VK_CLIENT_SECRET');
  }

  const tokenUrl = new URL('https://oauth.vk.com/access_token');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);

  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json() as {
    user_id?: number;
    email?: string;
    access_token?: string;
    error?: string;
  };
  if (!tokenRes.ok || !tokenData.user_id || !tokenData.access_token) {
    throw new Error(tokenData.error ?? 'Не удалось получить токен VK');
  }

  return fetchLegacyVkProfile(tokenData.user_id, tokenData.access_token, tokenData.email);
}

async function exchangeVkIdCode(params: {
  code: string;
  deviceId: string;
  codeVerifier: string;
  state?: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}): Promise<OAuthProfile> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    code_verifier: params.codeVerifier,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    device_id: params.deviceId,
  });
  if (params.state) {
    body.set('state', params.state);
  }
  if (params.clientSecret) {
    body.set('client_secret', params.clientSecret);
  }

  const tokenRes = await fetch('https://id.vk.ru/oauth2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenData = await tokenRes.json() as {
    access_token?: string;
    user_id?: number;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description ?? tokenData.error ?? 'Не удалось обменять код VK ID');
  }

  return fetchVkIdProfile(params.clientId, tokenData.access_token, tokenData.user_id);
}

async function fetchVkIdProfile(
  clientId: string,
  accessToken: string,
  userIdHint?: number,
): Promise<OAuthProfile> {
  const userRes = await fetch('https://id.vk.ru/oauth2/user_info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      access_token: accessToken,
    }),
  });
  const userData = await userRes.json() as {
    user?: {
      user_id?: string;
      first_name?: string;
      last_name?: string;
      avatar?: string;
      email?: string;
    };
    error?: string;
    error_description?: string;
  };
  if (!userRes.ok || !userData.user?.user_id) {
    throw new Error(userData.error_description ?? userData.error ?? 'VK ID не вернул профиль');
  }

  const vkUser = userData.user;
  const providerId = vkUser.user_id ?? String(userIdHint ?? '');
  const email = vkUser.email?.trim()
    ?? `vk${providerId}@vk.nagaevomaster.local`;

  return {
    provider: 'vk',
    providerId,
    email,
    name: [vkUser.first_name, vkUser.last_name].filter(Boolean).join(' ').trim() || `VK ${providerId}`,
    avatarUrl: vkUser.avatar,
  };
}

async function fetchLegacyVkProfile(
  userId: number,
  accessToken: string,
  emailHint?: string,
): Promise<OAuthProfile> {
  const usersUrl = new URL('https://api.vk.com/method/users.get');
  usersUrl.searchParams.set('user_ids', String(userId));
  usersUrl.searchParams.set('fields', 'photo_200');
  usersUrl.searchParams.set('access_token', accessToken);
  usersUrl.searchParams.set('v', '5.199');

  const usersRes = await fetch(usersUrl);
  const usersData = await usersRes.json() as {
    response?: { first_name: string; last_name: string; photo_200?: string }[];
  };
  const vkUser = usersData.response?.[0];
  const email = emailHint ?? `vk${userId}@vk.nagaevomaster.local`;

  return {
    provider: 'vk',
    providerId: String(userId),
    email,
    name: vkUser ? `${vkUser.first_name} ${vkUser.last_name}`.trim() : `VK ${userId}`,
    avatarUrl: vkUser?.photo_200,
  };
}

async function verifyVkIdAccessToken(accessToken: string): Promise<OAuthProfile> {
  const clientId = env.VK_CLIENT_ID;
  if (!clientId) {
    throw new Error('VK OAuth не настроен');
  }
  return fetchVkIdProfile(clientId, accessToken);
}

export {
  exchangeGoogleCode,
  exchangeVkCode,
  verifyVkIdAccessToken,
  findOrCreateOAuthUser,
  buildAuthSuccessRedirect,
  buildAuthErrorRedirect,
  toUserResponse,
}
