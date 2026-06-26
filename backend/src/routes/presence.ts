import { Router } from 'express';
import { optionalAuth, type AuthRequest } from '../middleware/auth.js';
import { getUsersOnlineStatus, touchPresence } from '../services/presence.js';

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

presenceRouter.get('/users', optionalAuth, (req, res) => {
  const raw = typeof req.query.ids === 'string' ? req.query.ids : '';
  const userIds = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 100);

  res.json({ online: getUsersOnlineStatus(userIds) });
});

export {
  presenceRouter,
}
