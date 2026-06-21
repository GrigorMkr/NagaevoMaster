import { env } from '../../config/env.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface SiteVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

function isRecaptchaEnabled(): boolean {
  return Boolean(env.RECAPTCHA_SECRET_KEY && env.RECAPTCHA_SITE_KEY);
}

async function verifyRecaptcha(token: string, remoteIp?: string): Promise<boolean> {
  const secret = env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) return false;

  const data = await response.json() as SiteVerifyResponse;
  return data.success === true;
}

async function assertRecaptchaValid(token: string | undefined, remoteIp?: string): Promise<void> {
  if (!isRecaptchaEnabled()) {
    return;
  }

  if (!token) {
    throw new HttpError(400, 'Подтвердите, что вы не робот');
  }

  const valid = await verifyRecaptcha(token, remoteIp);
  if (!valid) {
    throw new HttpError(400, 'Проверка капчи не пройдена. Попробуйте снова.');
  }
}

export {
  isRecaptchaEnabled,
  verifyRecaptcha,
  assertRecaptchaValid,
};
