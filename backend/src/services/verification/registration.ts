import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { normalizePhone } from '../../utils/phone.js';
import { sendVerificationEmail } from '../notify/email.js';
import { sendVerificationSms } from '../notify/sms.js';
import {
  MAX_ATTEMPTS,
  generateVerificationCode,
  getVerificationExpiry,
  hashVerificationCode,
  verifyVerificationCode,
} from './codes.js';
import type { RegistrationPayload, VerificationChannel } from './types.js';

const RESEND_COOLDOWN_MS = 60 * 1000;

interface RegisterInput {
  channel: VerificationChannel;
  user: string;
  password: string;
  name: string;
  phone: string;
}

function normalizeTarget(channel: VerificationChannel, email: string, phone: string): string {
  if (channel === 'email') {
    return email.trim().toLowerCase();
  }
  return normalizePhone(phone);
}

async function assertRegistrationAvailable(email: string, phone: string): Promise<void> {
  const normalizedPhone = normalizePhone(phone);
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new HttpError(409, 'Пользователь с таким email уже существует');
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existingPhone) {
    throw new HttpError(409, 'Пользователь с таким телефоном уже существует');
  }
}

async function sendRegistrationCode(input: RegisterInput): Promise<{ channel: VerificationChannel; target: string }> {
  const email = input.user.trim().toLowerCase();
  const target = normalizeTarget(input.channel, email, input.phone);

  await assertRegistrationAvailable(email, input.phone);

  const recent = await prisma.verificationChallenge.findFirst({
    where: {
      channel: input.channel,
      target,
      createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    throw new HttpError(429, 'Подождите минуту перед повторной отправкой кода');
  }

  const code = generateVerificationCode();
  const payload: RegistrationPayload = {
    name: input.name.trim(),
    email,
    phone: normalizePhone(input.phone),
    passwordHash: await bcrypt.hash(input.password, 10),
  };

  await prisma.verificationChallenge.deleteMany({
    where: { channel: input.channel, target },
  });

  await prisma.verificationChallenge.create({
    data: {
      channel: input.channel,
      target,
      codeHash: await hashVerificationCode(code),
      payload: JSON.stringify(payload),
      expiresAt: getVerificationExpiry(),
    },
  });

  if (input.channel === 'email') {
    await sendVerificationEmail(target, code);
  } else {
    await sendVerificationSms(target, code);
  }

  return { channel: input.channel, target };
}

async function verifyRegistrationCode(
  channel: VerificationChannel,
  target: string,
  code: string,
) {
  const normalizedTarget = channel === 'email'
    ? target.trim().toLowerCase()
    : normalizePhone(target);

  const challenge = await prisma.verificationChallenge.findFirst({
    where: { channel, target: normalizedTarget },
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
    throw new HttpError(400, 'Неверный код подтверждения');
  }

  const payload = JSON.parse(challenge.payload) as RegistrationPayload;
  await assertRegistrationAvailable(payload.email, payload.phone);

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash: payload.passwordHash,
      name: payload.name,
      phone: payload.phone,
      role: 'user',
      emailVerified: channel === 'email',
      phoneVerified: channel === 'sms',
    },
  });

  await prisma.verificationChallenge.delete({ where: { id: challenge.id } });

  const { sendWelcomeMessageToUser } = await import('../welcomeMessage.js');
  void sendWelcomeMessageToUser(user.id).catch(() => {});

  return user;
}

export {
  sendRegistrationCode,
  verifyRegistrationCode,
}

export type {
  RegisterInput,
}
