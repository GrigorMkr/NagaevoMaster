import { Router } from 'express';
import { z } from 'zod';
import type { Listing } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getDistanceKm } from '../utils/geo.js';
import { toListingResponse } from '../utils/mappers.js';
import { routeParam } from '../utils/params.js';
import { sendModeratorNewListingEmail } from '../services/notify/email.js';
import { assertCleanContent } from '../services/moderation/contentFilter.js';
const listingsRouter = Router();
const listingUserSelect = {
    select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
    },
} as const;
const NAGAEVO_CENTER = { lat: 54.6245, lng: 56.1082 };
const PAGE_SIZE = 24;
const PRICE_UNITS = ['час', 'день', 'м²', 'услуга', 'шт', 'договор', 'награда'] as const;
const LISTING_KINDS = ['service', 'sale', 'vacancy', 'lost'] as const;

const createListingSchema = z.object({
    kind: z.enum(LISTING_KINDS).optional().default('service'),
    category: z.string().min(1),
    subcategory: z.string().min(1),
    title: z.string().min(3),
    description: z.string().min(10),
    priceFrom: z.number().nonnegative(),
    priceTo: z.number().positive().optional(),
    unit: z.enum(PRICE_UNITS),
    phone: z.string().min(10),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().min(3),
    }),
    imageIds: z.array(z.string()).max(10).optional(),
});
function resolveOrigin(query: Record<string, unknown>) {
    const originLat = Number(query.originLat);
    const originLng = Number(query.originLng);
    if (Number.isFinite(originLat) && Number.isFinite(originLng)) {
        return { lat: originLat, lng: originLng };
    }
    return NAGAEVO_CENTER;
}
function sortListings<T extends Listing>(items: T[], sortBy: string | undefined, origin: {
    lat: number;
    lng: number;
}): T[] {
    const sorted = [...items];
    if (sortBy === 'distance') {
        sorted.sort((a, b) => getDistanceKm(origin.lat, origin.lng, a.lat, a.lng) -
            getDistanceKm(origin.lat, origin.lng, b.lat, b.lng));
    }
    else if (sortBy === 'price_asc') {
        sorted.sort((a, b) => a.priceFrom - b.priceFrom);
    }
    else if (sortBy === 'price_desc') {
        sorted.sort((a, b) => b.priceFrom - a.priceFrom);
    }
    else if (sortBy === 'newest') {
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    else if (sortBy === 'popular') {
        sorted.sort((a, b) => {
            const viewsDiff = b.viewsCount - a.viewsCount;
            if (viewsDiff !== 0) {
                return viewsDiff;
            }
            return b.reviewsCount - a.reviewsCount;
        });
    }
    else {
        sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
}
function assertModerator(role: string) {
    if (!['moderator', 'admin'].includes(role)) {
        throw new HttpError(403, 'Доступ только для модераторов');
    }
}
listingsRouter.get('/moderation/pending', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const listings = await prisma.listing.findMany({
            where: { status: 'pending' },
            include: { user: listingUserSelect },
            orderBy: { createdAt: 'asc' },
        });
        res.json(listings.map((item) => toListingResponse(item, item.user)));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.get('/moderation/listings', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const status = z.enum(['pending', 'published', 'rejected']).parse(
            typeof req.query.status === 'string' ? req.query.status : 'pending',
        );
        const listings = await prisma.listing.findMany({
            where: { status },
            include: { user: listingUserSelect },
            orderBy: { updatedAt: 'desc' },
            take: 50,
        });
        res.json(listings.map((item) => toListingResponse(item, item.user)));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.get('/moderation/reports', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const statusFilter = typeof req.query.status === 'string' ? req.query.status : 'pending';
        const reports = await prisma.report.findMany({
            where: statusFilter === 'all' ? undefined : { status: statusFilter },
            include: {
                listing: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        userId: true,
                        user: { select: { id: true, name: true, email: true, isBanned: true } },
                    },
                },
                reporter: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json(reports.map((report) => ({
            id: report.id,
            listingId: report.listingId,
            listingTitle: report.listing.title,
            listingStatus: report.listing.status,
            authorId: report.listing.userId,
            authorName: report.listing.user.name,
            authorEmail: report.listing.user.email,
            authorIsBanned: report.listing.user.isBanned,
            reporterName: report.reporter.name,
            reporterEmail: report.reporter.email,
            reason: report.reason ?? undefined,
            status: report.status,
            createdAt: report.createdAt.toISOString(),
        })));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.patch('/:id/status', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const listingId = routeParam(req.params.id);
        const { status } = z.object({
            status: z.enum(['published', 'rejected']),
        }).parse(req.body);
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        const updated = await prisma.listing.update({
            where: { id: listingId },
            data: { status },
            include: { user: listingUserSelect },
        });
        res.json(toListingResponse(updated, updated.user));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.get('/', async (req, res, next) => {
    try {
        const query = req.query;
        const origin = resolveOrigin(query as Record<string, unknown>);
        const page = Math.max(1, Number(query.page) || 1);
        const where: Record<string, unknown> = { status: 'published' };
        if (typeof query.kind === 'string' && query.kind) {
            where.kind = query.kind;
        }
        if (typeof query.category === 'string' && query.category) {
            where.category = query.category;
        }
        if (typeof query.subcategory === 'string' && query.subcategory) {
            where.subcategory = query.subcategory;
        }
        if (query.rating) {
            where.rating = { gte: Number(query.rating) };
        }
        if (query.priceMin !== undefined && query.priceMin !== '') {
            where.priceFrom = { ...(where.priceFrom as object), gte: Number(query.priceMin) };
        }
        if (query.priceMax !== undefined && query.priceMax !== '') {
            where.priceFrom = { ...(where.priceFrom as object), lte: Number(query.priceMax) };
        }
        let items = await prisma.listing.findMany({
            where: where as never,
            include: { user: listingUserSelect },
        });
        if (typeof query.query === 'string' && query.query.trim()) {
            const q = query.query.toLowerCase();
            items = items.filter((listing) => listing.title.toLowerCase().includes(q) ||
                listing.description.toLowerCase().includes(q) ||
                listing.subcategory.toLowerCase().includes(q));
        }
        if (query.distance) {
            const maxDistance = Number(query.distance);
            items = items.filter((listing) => getDistanceKm(origin.lat, origin.lng, listing.lat, listing.lng) <= maxDistance);
        }
        items = sortListings(items, typeof query.sortBy === 'string' ? query.sortBy : undefined, origin);
        const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
        const start = (page - 1) * PAGE_SIZE;
        const pageItems = items.slice(start, start + PAGE_SIZE);
        res.json({
            items: pageItems.map((item) => toListingResponse(item, item.user)),
            totalPages,
            page,
        });
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.get('/:id', async (req, res, next) => {
    try {
        const listingId = routeParam(req.params.id);
        const existing = await prisma.listing.findFirst({
            where: { id: listingId, status: 'published' },
        });
        if (!existing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        const listing = await prisma.listing.update({
            where: { id: listingId },
            data: { viewsCount: { increment: 1 } },
            include: { user: listingUserSelect },
        });
        res.json(toListingResponse(listing, listing.user));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.post('/', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const data = createListingSchema.parse(req.body);
        assertCleanContent(data.title, data.description);
        if (data.kind === 'service' && data.priceFrom <= 0) {
            throw new HttpError(400, 'Укажите цену для услуги');
        }
        const listing = await prisma.listing.create({
            data: {
                userId: req.user!.id,
                kind: data.kind,
                title: data.title,
                category: data.category,
                subcategory: data.subcategory,
                description: data.description,
                priceFrom: data.priceFrom,
                priceTo: data.priceTo,
                unit: data.unit,
                phone: data.phone,
                lat: data.location.lat,
                lng: data.location.lng,
                address: data.location.address,
                images: JSON.stringify(data.imageIds ?? []),
                status: 'pending',
                isVerified: false,
            },
        });
        void sendModeratorNewListingEmail({
            listingTitle: listing.title,
            authorName: req.user!.name,
            listingId: listing.id,
        }).catch((error) => {
            console.error('[email:moderator] failed', error);
        });
        res.status(201).json(toListingResponse(listing, req.user!));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.post('/:id/resubmit', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const listingId = routeParam(req.params.id);
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            include: { user: listingUserSelect },
        });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        if (listing.userId !== req.user!.id) {
            throw new HttpError(403, 'Недостаточно прав');
        }
        if (listing.status !== 'rejected') {
            throw new HttpError(400, 'Повторно отправить можно только отклонённые объявления');
        }
        const updated = await prisma.listing.update({
            where: { id: listing.id },
            data: { status: 'pending' },
            include: { user: listingUserSelect },
        });
        res.json(toListingResponse(updated, updated.user));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.patch('/:id', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const listingId = routeParam(req.params.id);
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        const isOwner = listing.userId === req.user!.id;
        const isModerator = ['moderator', 'admin'].includes(req.user!.role);
        if (!isOwner && !isModerator) {
            throw new HttpError(403, 'Недостаточно прав');
        }
        const data = createListingSchema.partial().parse(req.body);
        assertCleanContent(data.title, data.description);
        const ownerResubmit = isOwner && !isModerator && listing.status === 'rejected';
        const updated = await prisma.listing.update({
            where: { id: listing.id },
            data: {
                title: data.title,
                category: data.category,
                subcategory: data.subcategory,
                description: data.description,
                priceFrom: data.priceFrom,
                priceTo: data.priceTo,
                unit: data.unit,
                phone: data.phone,
                lat: data.location?.lat,
                lng: data.location?.lng,
                address: data.location?.address,
                images: data.imageIds ? JSON.stringify(data.imageIds) : undefined,
                status: ownerResubmit ? 'pending' : listing.status,
            },
            include: { user: listingUserSelect },
        });
        res.json(toListingResponse(updated, updated.user));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const listingId = routeParam(req.params.id);
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        const isOwner = listing.userId === req.user!.id;
        const isModerator = ['moderator', 'admin'].includes(req.user!.role);
        if (!isOwner && !isModerator) {
            throw new HttpError(403, 'Недостаточно прав');
        }
        await prisma.listing.delete({ where: { id: listing.id } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});

export {
  listingsRouter,
}
