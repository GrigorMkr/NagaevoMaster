import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
interface JwtPayload {
    userId: string;
}
function signToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}
function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export {
  signToken,
  verifyToken,
}

export type {
  JwtPayload,
}
