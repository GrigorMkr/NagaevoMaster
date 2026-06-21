import type { NextFunction, Request, Response } from 'express';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../lib/jwt.js';
import { HttpError } from './errorHandler.js';

interface AuthRequest extends Request {
  user?: User;
}

function assertSessionValid(user: User, sessionVersion?: number) {
  const tokenVersion = sessionVersion ?? 0;
  if (tokenVersion !== user.sessionVersion) {
    throw new HttpError(401, 'Сессия устарела. Войдите снова.');
  }
}

async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Требуется авторизация'));
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      next(new HttpError(401, 'Пользователь не найден'));
      return;
    }
    if (user.isBanned) {
      next(new HttpError(403, 'Аккаунт заблокирован за нарушение правил платформы'));
      return;
    }
    assertSessionValid(user, payload.sessionVersion);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(401, 'Недействительный токен'));
  }
}

async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.isBanned) {
      req.user = undefined;
      next();
      return;
    }
    assertSessionValid(user, payload.sessionVersion);
    req.user = user;
  } catch {
    req.user = undefined;
  }
  next();
}

export {
  requireAuth,
  optionalAuth,
};

export type {
  AuthRequest,
};
