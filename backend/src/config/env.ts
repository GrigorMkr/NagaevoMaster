import 'dotenv/config';

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

const env = {
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET: required('JWT_SECRET', 'dev-secret-change-in-production'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? './uploads',
  PUBLIC_UPLOAD_URL: process.env.PUBLIC_UPLOAD_URL ?? '/uploads',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_SECURE: optionalBoolean('SMTP_SECURE'),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  SMS_RU_API_ID: process.env.SMS_RU_API_ID,
};

export {
  env,
}
