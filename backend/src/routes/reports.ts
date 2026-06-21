import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { routeParam } from '../utils/params.js';
const reportsRouter = Router({ mergeParams: true });
const reportSchema = z.object({
    reason: z.string().max(1000).optional(),
});
reportsRouter.post('/', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const listingId = routeParam(req.params.listingId);
        const data = reportSchema.parse(req.body);
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        if (listing.userId === req.user!.id) {
            throw new HttpError(403, 'Нельзя пожаловаться на своё объявление');
        }
        const report = await prisma.report.create({
            data: {
                listingId,
                reporterId: req.user!.id,
                reason: data.reason,
            },
        });
        res.status(201).json({
            id: report.id,
            status: report.status,
            message: 'Жалоба принята',
        });
    }
    catch (error) {
        next(error);
    }
});

export {
  reportsRouter,
}
