import { Router } from 'express';
import { z } from 'zod';
import type { Listing } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getDistanceKm } from '../utils/geo.js';
import { toListingResponse } from '../utils/mappers.js';
import { routeParam } from '../utils/params.js';
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
const createListingSchema = z.object({
    category: z.string().min(1),
    subcategory: z.string().min(1),
    title: z.string().min(3),
    description: z.string().min(10),
    priceFrom: z.number().positive(),
    priceTo: z.number().positive().optional(),
    unit: z.enum(['час', 'день', 'м²', 'услуга', 'шт']),
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
function sortListings(items: Listing[], sortBy: string | undefined, origin: {
    lat: number;
    lng: number;
}) {
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
    else {
        sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
}
listingsRouter.get('/', async (req, res, next) => {
    try {
        const query = req.query;
        const origin = resolveOrigin(query as Record<string, unknown>);
        const page = Math.max(1, Number(query.page) || 1);
        const where: Record<string, unknown> = { status: 'published' };
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
        const listing = await prisma.listing.findFirst({
            where: { id: routeParam(req.params.id), status: 'published' },
            include: { user: listingUserSelect },
        });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        res.json(toListingResponse(listing, listing.user));
    }
    catch (error) {
        next(error);
    }
});
listingsRouter.post('/', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const data = createListingSchema.parse(req.body);
        const listing = await prisma.listing.create({
            data: {
                userId: req.user!.id,
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
        res.status(201).json(toListingResponse(listing, req.user!));
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
