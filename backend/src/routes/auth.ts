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
import { toUserResponse } from '../utils/mappers.js';

const authRouter = Router();

const loginSchema = z.object({
  user: z.string().email(),
  password: z.string().min(6),
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

function assertUserVerified(user: { emailVerified: boolean; phoneVerified: boolean }) {
  if (!user.emailVerified && !user.phoneVerified) {
    throw new HttpError(403, 'Подтвердите email или телефон для входа');
  }
}

authRouter.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.user } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new HttpError(401, 'Неверный email или пароль');
    }
    assertUserVerified(user);
    res.json({
      token: signToken(user.id),
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register/send-code', async (req, res, next) => {
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

authRouter.post('/register/verify', async (req, res, next) => {
  try {
    const data = verifyCodeSchema.parse(req.body);
    const user = await verifyRegistrationCode(data.channel, data.target, data.code);
    res.status(201).json({
      token: signToken(user.id),
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

authRouter.post('/recovery', async (req, res, next) => {
  try {
    const data = recoverySchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new HttpError(404, 'Пользователь с таким email не найден');
    }
    res.json({
      message: 'Если email зарегистрирован, инструкция по восстановлению будет отправлена',
    });
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
