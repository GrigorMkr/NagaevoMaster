import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { errorHandler, HttpError } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { listingsRouter } from './routes/listings.js';
import { reviewsRouter } from './routes/reviews.js';
import { favoritesRouter } from './routes/favorites.js';
import { forumRouter } from './routes/forum.js';
import { contactRouter } from './routes/contact.js';
import { uploadsRouter } from './routes/uploads.js';
import { usersRouter } from './routes/users.js';
import { reportsRouter } from './routes/reports.js';
function createApp() {
    const app = express();
    app.set('trust proxy', 1);
    app.use(cors({
        origin: env.CORS_ORIGIN.split(',').map((value) => value.trim()),
        credentials: true,
    }));
    app.use(express.json({ limit: '2mb' }));
    app.use(env.PUBLIC_UPLOAD_URL, express.static(path.resolve(env.UPLOAD_DIR)));
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', service: 'nagaevomaster-api' });
    });
    app.use('/api/auth', authRouter);
    app.use('/api/users', usersRouter);
    app.use('/api/listings', listingsRouter);
    app.use('/api/listings/:listingId/reviews', reviewsRouter);
    app.use('/api/listings/:listingId/report', reportsRouter);
    app.use('/api/favorites', favoritesRouter);
    app.use('/api/forum', forumRouter);
    app.use('/api/contact', contactRouter);
    app.use('/api/uploads', uploadsRouter);
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
}
