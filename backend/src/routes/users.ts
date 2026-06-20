import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { toListingResponse, toReviewResponse, toUserResponse } from '../utils/mappers.js';
const usersRouter = Router();
const listingUserSelect = {
    select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
    },
} as const;
const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    avatarUrl: z.string().min(1).max(500_000).optional(),
});
usersRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        res.json(toUserResponse(req.user!));
    }
    catch (error) {
        next(error);
    }
});
usersRouter.patch('/me', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const data = updateProfileSchema.parse(req.body);
        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data,
        });
        res.json(toUserResponse(user));
    }
    catch (error) {
        next(error);
    }
});
usersRouter.patch('/me/location', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const data = z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
            label: z.string().min(1).max(120).optional(),
        }).parse(req.body);
        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                lastLat: data.lat,
                lastLng: data.lng,
                lastLocationLabel: data.label ?? 'Текущее местоположение',
                lastLocationAt: new Date(),
            },
        });
        res.json(toUserResponse(user));
    }
    catch (error) {
        next(error);
    }
});
usersRouter.delete('/me/location', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                lastLat: null,
                lastLng: null,
                lastLocationLabel: null,
                lastLocationAt: null,
            },
        });
        res.json(toUserResponse(user));
    }
    catch (error) {
        next(error);
    }
});
usersRouter.get('/me/listings', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const listings = await prisma.listing.findMany({
            where: { userId: req.user!.id },
            include: { user: listingUserSelect },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(listings.map((listing) => toListingResponse(listing, listing.user)));
    }
    catch (error) {
        next(error);
    }
});
usersRouter.get('/me/reviews', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { userId: req.user!.id },
            include: {
                user: { select: { name: true } },
                listing: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(reviews.map((review) => ({
            ...toReviewResponse(review),
            listingTitle: review.listing.title,
            listingId: review.listing.id,
        })));
    }
    catch (error) {
        next(error);
    }
});

export {
  usersRouter,
}
