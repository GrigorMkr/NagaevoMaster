import { Router } from 'express';
import { optionalAuth, type AuthRequest } from '../middleware/auth.js';
import { touchPresence } from '../services/presence.js';

const presenceRouter = Router();

presenceRouter.post('/heartbeat', optionalAuth, (req: AuthRequest, res) => {
  if (req.user) {
    touchPresence(req.user.id, 'user');
  } else {
    const visitorId = typeof req.headers['x-visitor-id'] === 'string'
      ? req.headers['x-visitor-id'].trim()
      : '';
    if (visitorId.length >= 8 && visitorId.length <= 64) {
      touchPresence(`guest:${visitorId}`, 'guest');
    }
  }
  res.json({ ok: true });
});

export {
  presenceRouter,
}
