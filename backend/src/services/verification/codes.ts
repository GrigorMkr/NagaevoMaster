import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(CODE_LENGTH, '0');
}

async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

async function verifyVerificationCode(code: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

function getVerificationExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MS);
}

export {
  CODE_LENGTH,
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  generateVerificationCode,
  hashVerificationCode,
  verifyVerificationCode,
  getVerificationExpiry,
}
