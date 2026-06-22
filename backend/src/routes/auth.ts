import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import {
  sendRegistrationCode,
  verifyRegistrationCode,
} from '../services/verification/registration.js';
import {
  resetPasswordWithCode,
  sendPasswordRecoveryCode,
} from '../services/verification/passwordRecovery.js';
import { env } from '../config/env.js';
import {
  buildAuthErrorRedirect,
  buildAuthSuccessRedirect,
  exchangeGoogleCode,
  exchangeVkCode,
  findOrCreateOAuthUser,
  verifyVkIdAccessToken,
} from '../services/oauth/providers.js';
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from '../utils/pkce.js';
import {
  clearGoogleOAuthCookies,
  clearOAuthNativeCookie,
  clearVkOAuthCookies,
} from '../utils/oauthCookies.js';
import { consumeOAuthExchangeCode } from '../services/oauth/exchange.js';
import { consumeOAuthHandoff } from '../services/oauth/handoff.js';
import { createOAuthPendingSession, consumeOAuthPendingSession } from '../services/oauth/pending.js';
import {
  authLimiter,
  oauthExchangeLimiter,
  verificationLimiter,
} from '../middleware/security.js';
import { assertRecaptchaValid, isRecaptchaEnabled } from '../services/captcha/recaptcha.js';
import { toUserResponse } from '../utils/mappers.js';

const authRouter = Router();

const loginSchema = z.object({
  user: z.string().email(),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
  remember: z.boolean().optional().default(true),
  captchaToken: z.string().min(1).optional(),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  phone: z.string().min(10),
});

const sendCodeSchema = registerSchema.extend({
  channel: z.enum(['email', 'sms']),
});

const verifyCodeSchema = z.object({
  channel: z.enum(['email', 'sms']),
  target: z.string().min(3),
  code: z.string().length(6),
});

const recoverySchema = z.object({
  email: z.string().email(),
});

const recoveryResetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
});

const oauthExchangeSchema = z.object({
  code: z.string().min(1),
});

const oauthHandoffSchema = z.object({
  handoff: z.string().uuid(),
});

function issueAuthToken(user: { id: string; sessionVersion: number }, remember = true) {
  return signToken(user.id, { remember, sessionVersion: user.sessionVersion });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveOAuthPlatform(query: Record<string, unknown>): 'android' | 'ios' | undefined {
  const value = query.platform;
  if (value === 'android') return 'android';
  if (value === 'ios') return 'ios';
  return undefined;
}

function resolveOAuthDelivery(
  query: Record<string, unknown>,
  platform?: 'android' | 'ios',
): 'webview' | 'cct' | undefined {
  if (query.delivery === 'webview') return 'webview';
  if (platform === 'android') return 'cct';
  return undefined;
}

function assertUserVerified(user: { emailVerified: boolean; phoneVerified: boolean }) {
  if (!user.emailVerified && !user.phoneVerified) {
    throw new HttpError(403, 'Подтвердите email или телефон для входа');
  }
}

authRouter.get('/captcha-config', (_req, res) => {
  const required = isRecaptchaEnabled();
  res.json({
    required,
    siteKey: required ? env.RECAPTCHA_SITE_KEY : null,
  });
});

authRouter.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    await assertRecaptchaValid(data.captchaToken, req.ip);
    const email = normalizeEmail(data.user);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new HttpError(401, 'Неверный email или пароль');
    }
    if (user.isBanned) {
      throw new HttpError(403, 'Аккаунт заблокирован за нарушение правил платформы');
    }
    assertUserVerified(user);
    res.json({
      token: issueAuthToken(user, data.remember),
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register/send-code', verificationLimiter, async (req, res, next) => {
  try {
    const data = sendCodeSchema.parse(req.body);
    const result = await sendRegistrationCode(data);
    res.json({
      message: data.channel === 'email'
        ? 'Код отправлен на email'
        : 'Код отправлен в SMS',
      channel: result.channel,
      target: result.target,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register/verify', authLimiter, async (req, res, next) => {
  try {
    const data = verifyCodeSchema.parse(req.body);
    const user = await verifyRegistrationCode(data.channel, data.target, data.code);
    res.status(201).json({
      token: issueAuthToken(user),
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register', async (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    throw new HttpError(400, 'Сначала подтвердите email или телефон кодом');
  } catch (error) {
    next(error);
  }
});

authRouter.post('/recovery/send-code', verificationLimiter, async (req, res, next) => {
  try {
    const data = recoverySchema.parse(req.body);
    await sendPasswordRecoveryCode(normalizeEmail(data.email));
    res.json({
      message: 'Если email зарегистрирован, код отправлен на почту',
      target: normalizeEmail(data.email),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/recovery/reset', authLimiter, async (req, res, next) => {
  try {
    const data = recoveryResetSchema.parse(req.body);
    const user = await resetPasswordWithCode(
      normalizeEmail(data.email),
      data.code,
      data.password,
    );
    res.json({
      message: 'Пароль обновлён',
      token: issueAuthToken(user),
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/recovery', verificationLimiter, async (req, res, next) => {
  try {
    const data = recoverySchema.parse(req.body);
    await sendPasswordRecoveryCode(normalizeEmail(data.email));
    res.json({
      message: 'Если email зарегистрирован, код отправлен на почту',
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/oauth/status', (_req, res) => {
  res.json({
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    vk: Boolean(env.VK_CLIENT_ID),
    vkAppId: env.VK_CLIENT_ID ?? null,
    siteUrl: env.SITE_URL.replace(/\/$/, ''),
    googleCallback: `${env.SITE_URL.replace(/\/$/, '')}/api/auth/google/callback`,
    vkCallback: `${env.SITE_URL.replace(/\/$/, '')}/api/auth/vk/callback`,
  });
});

authRouter.get('/google', (req, res) => {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.redirect(buildAuthErrorRedirect('Вход через Google пока не настроен', req.query.native === '1'));
    return;
  }
  const native = req.query.native === '1';
  const platform = resolveOAuthPlatform(req.query);
  const delivery = resolveOAuthDelivery(req.query, platform);
  const state = createOAuthPendingSession({ provider: 'google', native, platform, delivery });
  const redirectUri = `${env.SITE_URL.replace(/\/$/, '')}/api/auth/google/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

authRouter.get('/google/callback', async (req, res) => {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  let isNative = false;
  let platform: 'android' | 'ios' | undefined;
  let delivery: 'webview' | 'cct' | undefined;

  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const pending = state ? consumeOAuthPendingSession(state, 'google') : null;
    isNative = pending?.native ?? false;
    platform = pending?.platform;
    delivery = pending?.delivery;
    clearGoogleOAuthCookies(res);
    clearOAuthNativeCookie(res);

    if (!code) {
      res.redirect(buildAuthErrorRedirect('Авторизация Google отменена', isNative, platform, delivery));
      return;
    }
    if (!pending) {
      res.redirect(buildAuthErrorRedirect('Ошибка безопасности Google OAuth', isNative, platform, delivery));
      return;
    }

    const profile = await exchangeGoogleCode(code);
    const user = await findOrCreateOAuthUser(profile);
    if (user.isBanned) {
      res.redirect(buildAuthErrorRedirect('Аккаунт заблокирован', isNative, platform, delivery));
      return;
    }
    res.redirect(buildAuthSuccessRedirect(issueAuthToken(user), isNative, platform, delivery));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка Google';
    clearGoogleOAuthCookies(res);
    clearOAuthNativeCookie(res);
    res.redirect(buildAuthErrorRedirect(message, isNative, platform, delivery));
  }
});

authRouter.get('/vk', (req, res) => {
  const clientId = env.VK_CLIENT_ID;
  if (!clientId) {
    res.redirect(buildAuthErrorRedirect('Вход через ВКонтакте пока не настроен', req.query.native === '1'));
    return;
  }
  const native = req.query.native === '1';
  const platform = resolveOAuthPlatform(req.query);
  const delivery = resolveOAuthDelivery(req.query, platform);
  const redirectUri = `${env.SITE_URL.replace(/\/$/, '')}/api/auth/vk/callback`;
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = createOAuthPendingSession({
    provider: 'vk',
    native,
    platform,
    delivery,
    codeVerifier,
  });

  const url = new URL('https://id.vk.ru/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'email');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  res.redirect(url.toString());
});

authRouter.get('/vk/callback', async (req, res) => {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  let isNative = false;
  let platform: 'android' | 'ios' | undefined;
  let delivery: 'webview' | 'cct' | undefined;

  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const deviceId = typeof req.query.device_id === 'string' ? req.query.device_id : '';
    const pending = state ? consumeOAuthPendingSession(state, 'vk') : null;
    isNative = pending?.native ?? false;
    platform = pending?.platform;
    delivery = pending?.delivery;
    clearVkOAuthCookies(res);
    clearOAuthNativeCookie(res);

    if (!code) {
      res.redirect(buildAuthErrorRedirect('Авторизация ВКонтакте отменена', isNative, platform, delivery));
      return;
    }

    if (!pending?.codeVerifier) {
      res.redirect(buildAuthErrorRedirect('Сессия VK истекла. Нажмите «ВКонтакте» ещё раз', isNative, platform, delivery));
      return;
    }

    if (!deviceId) {
      res.redirect(buildAuthErrorRedirect('Ошибка VK ID. Повторите вход через ВКонтакте', isNative, platform, delivery));
      return;
    }

    const profile = await exchangeVkCode(code, {
      deviceId,
      codeVerifier: pending.codeVerifier,
      state,
    });

    const user = await findOrCreateOAuthUser(profile);
    if (user.isBanned) {
      res.redirect(buildAuthErrorRedirect('Аккаунт заблокирован', isNative, platform, delivery));
      return;
    }
    res.redirect(buildAuthSuccessRedirect(issueAuthToken(user), isNative, platform, delivery));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка VK';
    clearVkOAuthCookies(res);
    clearOAuthNativeCookie(res);
    res.redirect(buildAuthErrorRedirect(message, isNative, platform, delivery));
  }
});

authRouter.post('/oauth/exchange', oauthExchangeLimiter, async (req, res, next) => {
  try {
    const { code } = oauthExchangeSchema.parse(req.body);
    const token = consumeOAuthExchangeCode(code);
    if (!token) {
      throw new HttpError(400, 'Код входа недействителен или истёк');
    }
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/oauth/handoff', oauthExchangeLimiter, async (req, res, next) => {
  try {
    const { handoff } = oauthHandoffSchema.parse(req.body);
    const token = consumeOAuthHandoff(handoff);
    if (!token) {
      throw new HttpError(400, 'Сессия входа недействительна или истекла');
    }
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

const vkCompleteSchema = z.object({
  access_token: z.string().min(1),
});

authRouter.post('/vk/complete', authLimiter, async (req, res, next) => {
  try {
    const parsed = vkCompleteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Некорректный токен VK');
    }
    const profile = await verifyVkIdAccessToken(parsed.data.access_token);
    const user = await findOrCreateOAuthUser(profile);
    if (user.isBanned) {
      throw new HttpError(403, 'Аккаунт заблокирован');
    }
    const token = issueAuthToken(user);
    res.json({ token, user: toUserResponse(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    res.json(toUserResponse(req.user!));
  } catch (error) {
    next(error);
  }
});

export {
  authRouter,
}
