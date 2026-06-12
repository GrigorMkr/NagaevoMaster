import 'dotenv/config';
function required(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
}
const env = {
    PORT: Number(process.env.PORT ?? 4000),
    JWT_SECRET: required('JWT_SECRET', 'dev-secret-change-in-production'),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    UPLOAD_DIR: process.env.UPLOAD_DIR ?? './uploads',
    PUBLIC_UPLOAD_URL: process.env.PUBLIC_UPLOAD_URL ?? '/uploads',
};

export {
  env,
}
