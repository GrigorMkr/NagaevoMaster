import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { toListingResponse } from '../utils/mappers.js';
import { routeParam } from '../utils/params.js';

const moderationRouter = Router();

const listingUserSelect = {
    select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
    },
} as const;

function assertModerator(role: string) {
    if (!['moderator', 'admin'].includes(role)) {
        throw new HttpError(403, 'Доступ только для модераторов');
    }
}

moderationRouter.use(requireAuth);

moderationRouter.get('/listings', async (req: AuthRequest, res, next) => {
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

moderationRouter.patch('/listings/:id/status', async (req: AuthRequest, res, next) => {
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

moderationRouter.get('/reports', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const statusFilter = typeof req.query.status === 'string' ? req.query.status : 'pending';
        const reports = await prisma.report.findMany({
            where: statusFilter === 'all' ? undefined : { status: statusFilter },
            include: {
                listing: { select: { id: true, title: true, status: true } },
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

moderationRouter.patch('/reports/:id', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const reportId = routeParam(req.params.id);
        const { status } = z.object({
            status: z.enum(['resolved', 'dismissed']),
        }).parse(req.body);
        const updated = await prisma.report.update({
            where: { id: reportId },
            data: { status },
        });
        res.json({
            id: updated.id,
            status: updated.status,
        });
    }
    catch (error) {
        next(error);
    }
});

export {
  moderationRouter,
}
