import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { toListingResponse } from '../utils/mappers.js';
import { routeParam } from '../utils/params.js';
const favoritesRouter = Router();
const listingUserSelect = {
    select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
    },
} as const;
favoritesRouter.get('/', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId: req.user!.id },
            select: { listingId: true },
        });
        res.json(favorites.map((item) => item.listingId));
    }
    catch (error) {
        next(error);
    }
});
favoritesRouter.get('/listings', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId: req.user!.id },
            include: {
                listing: { include: { user: listingUserSelect } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(favorites
            .map((item) => toListingResponse(item.listing, item.listing.user))
            .filter((listing) => listing.status === 'published'));
    }
    catch (error) {
        next(error);
    }
});
favoritesRouter.post('/:listingId', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const listingId = routeParam(req.params.listingId);
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        await prisma.favorite.upsert({
            where: {
                userId_listingId: {
                    userId: req.user!.id,
                    listingId: listing.id,
                },
            },
            create: {
                userId: req.user!.id,
                listingId: listing.id,
            },
            update: {},
        });
        res.status(201).json({ listingId: listing.id });
    }
    catch (error) {
        next(error);
    }
});
favoritesRouter.delete('/:listingId', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const listingId = routeParam(req.params.listingId);
        await prisma.favorite.deleteMany({
            where: {
                userId: req.user!.id,
                listingId,
            },
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});

export {
  favoritesRouter,
}
