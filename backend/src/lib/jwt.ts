import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

interface JwtPayload {
  userId: string;
  sessionVersion?: number;
}

interface SignTokenOptions {
  remember?: boolean;
  sessionVersion?: number;
}

function signToken(userId: string, options: SignTokenOptions = {}): string {
  const remember = options.remember ?? true;
  const sessionVersion = options.sessionVersion ?? 0;
  return jwt.sign(
    { userId, sessionVersion },
    env.JWT_SECRET,
    { expiresIn: remember ? '30d' : '1d' },
  );
}

function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export {
  signToken,
  verifyToken,
};

export type {
  JwtPayload,
  SignTokenOptions,
};
