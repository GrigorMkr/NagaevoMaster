import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { sendPasswordRecoveryEmail } from '../notify/email.js';
import {
  MAX_ATTEMPTS,
  generateVerificationCode,
  getVerificationExpiry,
  hashVerificationCode,
  verifyVerificationCode,
} from './codes.js';

const RECOVERY_CHANNEL = 'recovery';
const RESEND_COOLDOWN_MS = 60 * 1000;

async function sendPasswordRecoveryCode(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return;
  }

  const recent = await prisma.verificationChallenge.findFirst({
    where: {
      channel: RECOVERY_CHANNEL,
      target: normalizedEmail,
      createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    throw new HttpError(429, 'Подождите минуту перед повторной отправкой кода');
  }

  const code = generateVerificationCode();

  await prisma.verificationChallenge.deleteMany({
    where: { channel: RECOVERY_CHANNEL, target: normalizedEmail },
  });

  await prisma.verificationChallenge.create({
    data: {
      channel: RECOVERY_CHANNEL,
      target: normalizedEmail,
      codeHash: await hashVerificationCode(code),
      payload: JSON.stringify({ userId: user.id, email: normalizedEmail }),
      expiresAt: getVerificationExpiry(),
    },
  });

  await sendPasswordRecoveryEmail(normalizedEmail, code);
}

async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const challenge = await prisma.verificationChallenge.findFirst({
    where: { channel: RECOVERY_CHANNEL, target: normalizedEmail },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    throw new HttpError(400, 'Код не найден. Запросите новый.');
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    await prisma.verificationChallenge.delete({ where: { id: challenge.id } });
    throw new HttpError(400, 'Срок действия кода истёк. Запросите новый.');
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'Превышено число попыток. Запросите новый код.');
  }

  const isValid = await verifyVerificationCode(code, challenge.codeHash);
  if (!isValid) {
    await prisma.verificationChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    throw new HttpError(400, 'Неверный код');
  }

  const payload = JSON.parse(challenge.payload) as { userId: string; email: string };
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
  });

  await prisma.verificationChallenge.delete({ where: { id: challenge.id } });

  return user;
}

export {
  sendPasswordRecoveryCode,
  resetPasswordWithCode,
}
