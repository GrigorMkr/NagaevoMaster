import 'dotenv/config';
import { ensureHttpsUrl } from '../utils/secureUrl.js';

const INSECURE_JWT_SECRETS = new Set([
  'dev-secret-change-in-production',
  'secret',
  'jwt-secret',
  'changeme',
]);

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function optionalBoolean(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

function assertProductionSecrets(nodeEnv: string, jwtSecret: string) {
  if (nodeEnv !== 'production') return;

  if (jwtSecret.length < 32 || INSECURE_JWT_SECRETS.has(jwtSecret)) {
    throw new Error(
      'JWT_SECRET must be a strong random string (32+ chars) in production. '
      + 'Generate: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
    );
  }
}

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const JWT_SECRET = required('JWT_SECRET', 'dev-secret-change-in-production');

assertProductionSecrets(NODE_ENV, JWT_SECRET);

const env = {
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV,
  JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? './uploads',
  PUBLIC_UPLOAD_URL: ensureHttpsUrl(process.env.PUBLIC_UPLOAD_URL ?? '/uploads'),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_SECURE: optionalBoolean('SMTP_SECURE'),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  SMS_RU_API_ID: process.env.SMS_RU_API_ID,
  MODERATOR_NOTIFY_EMAIL: process.env.MODERATOR_NOTIFY_EMAIL ?? 'Grom666e@gmail.com',
  CONTACT_NOTIFY_EMAIL: process.env.CONTACT_NOTIFY_EMAIL ?? process.env.MODERATOR_NOTIFY_EMAIL ?? 'Grom666e@gmail.com',
  SITE_URL: ensureHttpsUrl(process.env.SITE_URL ?? 'https://nagaevomaster.ru'),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  VK_CLIENT_ID: process.env.VK_CLIENT_ID,
  VK_CLIENT_SECRET: process.env.VK_CLIENT_SECRET,
  VK_SERVICE_TOKEN: process.env.VK_SERVICE_TOKEN,
  VK_MAPS_API_KEY: process.env.VK_MAPS_API_KEY,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT ?? 'mailto:noreply@nagaevomaster.ru',
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID,
  FCM_SERVICE_ACCOUNT_PATH: process.env.FCM_SERVICE_ACCOUNT_PATH,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  ALLOW_VK_CLIENT_COMPLETE: optionalBoolean('ALLOW_VK_CLIENT_COMPLETE'),
  RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
};

export {
  env,
};
