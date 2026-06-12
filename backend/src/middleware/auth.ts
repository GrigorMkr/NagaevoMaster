import type { NextFunction, Request, Response } from 'express'
import type { User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { verifyToken } from '../lib/jwt.js'
import { HttpError } from './errorHandler.js'

export interface AuthRequest extends Request {
  user?: User
}

export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Требуется авторизация'))
    return
  }

  try {
    const payload = verifyToken(header.slice(7))
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      next(new HttpError(401, 'Пользователь не найден'))
      return
    }
    req.user = user
    next()
  } catch {
    next(new HttpError(401, 'Недействительный токен'))
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next()
    return
  }

  try {
    const payload = verifyToken(header.slice(7))
    req.user = (await prisma.user.findUnique({ where: { id: payload.userId } })) ?? undefined
  } catch {
    req.user = undefined
  }

  next()
}
