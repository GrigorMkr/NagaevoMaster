import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { routeParam } from '../utils/params.js';
import { toListingResponse, toReviewResponse, toUserResponse } from '../utils/mappers.js';
import { isBirthdayToday } from '../utils/birthDate.js';
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
    avatarUrl: z.string().url().max(2048).optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    homeAddress: z.string().max(240).nullable().optional(),
    homeLat: z.number().min(-90).max(90).nullable().optional(),
    homeLng: z.number().min(-180).max(180).nullable().optional(),
}).superRefine((data, ctx) => {
    const hasAddress = Boolean(data.homeAddress?.trim());
    const hasCoords = data.homeLat != null && data.homeLng != null;
    if (hasAddress && !hasCoords) {
        ctx.addIssue({ code: 'custom', message: 'Укажите точку на карте для адреса' });
    }
    if (!hasAddress && (data.homeLat != null || data.homeLng != null)) {
        ctx.addIssue({ code: 'custom', message: 'Укажите текст адреса' });
    }
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
        const { birthDate, ...rest } = updateProfileSchema.parse(req.body);
        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                ...rest,
                birthDate: birthDate === undefined
                    ? undefined
                    : (birthDate ? new Date(`${birthDate}T12:00:00.000Z`) : null),
            },
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

usersRouter.get('/:userId/profile', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const userId = routeParam(req.params.userId);
        const viewerId = req.user!.id;

        const block = await prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: viewerId, blockedId: userId },
                    { blockerId: userId, blockedId: viewerId },
                ],
            },
        });
        if (block) {
            throw new HttpError(403, 'Профиль недоступен');
        }

        const viewerRole = req.user!.role;
        const isStaff = ['admin', 'moderator'].includes(viewerRole);

        const friendship = await prisma.friendship.findFirst({
            where: {
                status: 'accepted',
                OR: [
                    { requesterId: viewerId, addresseeId: userId },
                    { requesterId: userId, addresseeId: viewerId },
                ],
            },
        });
        const showContacts = isStaff || !!friendship;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                birthDate: true,
                homeAddress: true,
                homeLat: true,
                homeLng: true,
                isBanned: true,
            },
        });
        if (!user || user.isBanned) {
            throw new HttpError(404, 'Пользователь не найден');
        }

        const listings = await prisma.listing.findMany({
            where: { userId, status: 'published' },
            include: { user: listingUserSelect },
            orderBy: { updatedAt: 'desc' },
            take: 12,
        });

        const homeLocation = showContacts && user.homeLat != null && user.homeLng != null && user.homeAddress
            ? {
                lat: user.homeLat,
                lng: user.homeLng,
                address: user.homeAddress,
            }
            : undefined;

        res.json({
            user: {
                id: user.id,
                name: user.name,
                login: user.email.split('@')[0] ?? user.email,
                avatarUrl: user.avatarUrl ?? undefined,
                ...(showContacts
                    ? {
                        phone: user.phone ?? undefined,
                        email: user.email,
                        birthdayToday: isBirthdayToday(user.birthDate),
                        homeLocation,
                    }
                    : {}),
            },
            listings: listings.map((listing) => toListingResponse(listing, listing.user)),
        });
    }
    catch (error) {
        next(error);
    }
});

export {
  usersRouter,
}
