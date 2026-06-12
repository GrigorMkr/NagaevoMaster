import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
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
const recoverySchema = z.object({
    email: z.string().email(),
});
authRouter.post('/login', async (req, res, next) => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email: data.user } });
        if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
            throw new HttpError(401, 'Неверный email или пароль');
        }
        res.json({
            token: signToken(user.id),
            user: toUserResponse(user),
        });
    }
    catch (error) {
        next(error);
    }
});
authRouter.post('/register', async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);
        const existing = await prisma.user.findUnique({ where: { email: data.user } });
        if (existing) {
            throw new HttpError(409, 'Пользователь с таким email уже существует');
        }
        const user = await prisma.user.create({
            data: {
                email: data.user,
                passwordHash: await bcrypt.hash(data.password, 10),
                name: data.name,
                phone: data.phone,
                role: 'user',
            },
        });
        res.status(201).json({
            token: signToken(user.id),
            user: toUserResponse(user),
        });
    }
    catch (error) {
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
    }
    catch (error) {
        next(error);
    }
});
authRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        res.json(toUserResponse(req.user!));
    }
    catch (error) {
        next(error);
    }
});

export {
  authRouter,
}
