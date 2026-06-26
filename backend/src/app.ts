import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { errorHandler, HttpError } from './middleware/errorHandler.js';
import {
  contactLimiter,
  securityHeaders,
  uploadLimiter,
} from './middleware/security.js';
import { authRouter } from './routes/auth.js';
import { listingsRouter } from './routes/listings.js';
import { reviewsRouter } from './routes/reviews.js';
import { favoritesRouter } from './routes/favorites.js';
import { forumRouter } from './routes/forum.js';
import { contactRouter } from './routes/contact.js';
import { uploadsRouter } from './routes/uploads.js';
import { usersRouter } from './routes/users.js';
import { reportsRouter } from './routes/reports.js';
import { notificationsRouter } from './routes/notifications.js';
import { moderationRouter } from './routes/moderation.js';
import { messagesRouter } from './routes/messages.js';
import { presenceRouter } from './routes/presence.js';
import { blocksRouter } from './routes/blocks.js';
import { friendsRouter } from './routes/friends.js';
import { newsRouter } from './routes/news.js';
import { pushRouter } from './routes/push.js';
import { listingSocialRouter } from './routes/listingSocial.js';
import { groupsRouter } from './routes/groups.js';
import { geoRouter } from './routes/geo.js';

function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowed = env.CORS_ORIGIN.split(',').map((value) => value.trim());
      if (
        allowed.includes(origin)
        || origin === 'https://localhost'
        || origin === 'http://localhost'
        || origin.startsWith('capacitor://')
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(env.PUBLIC_UPLOAD_URL, express.static(path.resolve(env.UPLOAD_DIR), {
    dotfiles: 'deny',
    index: false,
    fallthrough: false,
  }));
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nagaevomaster-api' });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/listings', listingsRouter);
  app.use('/api/listings/:listingId/reviews', reviewsRouter);
  app.use('/api/listings/:listingId/report', reportsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/listing-social', listingSocialRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/moderation', moderationRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/presence', presenceRouter);
  app.use('/api/blocks', blocksRouter);
  app.use('/api/friends', friendsRouter);
  app.use('/api/geo', geoRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/push', pushRouter);
  app.use('/api/forum', forumRouter);
  app.use('/api/contact', contactLimiter, contactRouter);
  app.use('/api/uploads', uploadLimiter, uploadsRouter);
  app.use((_req, _res, next) => {
    next(new HttpError(404, 'Маршрут не найден'));
  });
  app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof ZodError) {
      res.status(400).json({ message: error.issues[0]?.message ?? 'Некорректные данные' });
      return;
    }
    errorHandler(error, req, res, next);
  });
  return app;
}

export {
  createApp,
};
