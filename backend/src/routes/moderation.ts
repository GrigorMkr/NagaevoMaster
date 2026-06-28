import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { toListingResponse } from '../utils/mappers.js';
import { routeParam } from '../utils/params.js';
import { BAN_POLICY_TEXT } from '../constants/communityRules.js';
import { assertCleanContent, findContentViolations } from '../services/moderation/contentFilter.js';
import { getOnlineStats } from '../services/presence.js';
import { getAdminDashboardStats } from '../services/adminStats.js';
import { getAdminNetworkUsers } from '../services/adminNetwork.js';

const moderationRouter = Router();

const listingUserSelect = {
    select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isBanned: true,
    },
} as const;

function assertModerator(role: string) {
    if (!['moderator', 'admin'].includes(role)) {
        throw new HttpError(403, 'Доступ только для модераторов');
    }
}

function assertAdmin(role: string) {
    if (role !== 'admin') {
        throw new HttpError(403, 'Доступ только для администратора');
    }
}

function listingContentViolations(title: string, description: string): string[] {
    return findContentViolations(`${title}\n${description}`);
}

async function banUserAccount(
    targetUserId: string,
    moderator: { id: string; role: string },
    reason: string,
) {
    if (targetUserId === moderator.id) {
        throw new HttpError(400, 'Нельзя заблокировать самого себя');
    }
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
        throw new HttpError(404, 'Пользователь не найден');
    }
    if (target.isBanned) {
        return target;
    }
    const banned = await prisma.user.update({
        where: { id: targetUserId },
        data: {
            isBanned: true,
            bannedAt: new Date(),
            banReason: reason || BAN_POLICY_TEXT,
            sessionVersion: { increment: 1 },
        },
    });
    await prisma.listing.updateMany({
        where: { userId: targetUserId, status: { in: ['pending', 'published'] } },
        data: { status: 'rejected' },
    });
    return banned;
}

moderationRouter.use(requireAuth);

moderationRouter.get('/online-stats', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        res.json(getOnlineStats());
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.get('/online-stats', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        res.json(getOnlineStats());
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.get('/dashboard-stats', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        res.json(await getAdminDashboardStats());
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.get('/users/network', async (req: AuthRequest, res, next) => {
    try {
        assertAdmin(req.user!.role);
        res.json(await getAdminNetworkUsers());
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.get('/users', async (req: AuthRequest, res, next) => {
    try {
        assertAdmin(req.user!.role);
        const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const users = await prisma.user.findMany({
            where: query.length >= 2
                ? {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ],
                }
                : undefined,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isBanned: true,
                createdAt: true,
                phone: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 40,
        });
        res.json(users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            login: user.email.split('@')[0] ?? user.email,
            role: user.role,
            isBanned: user.isBanned,
            phone: user.phone ?? undefined,
            createdAt: user.createdAt.toISOString(),
        })));
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.patch('/users/:userId/role', async (req: AuthRequest, res, next) => {
    try {
        assertAdmin(req.user!.role);
        const userId = routeParam(req.params.userId);
        const { role } = z.object({
            role: z.enum(['user', 'master', 'moderator', 'admin']),
        }).parse(req.body);
        if (userId === req.user!.id && role !== 'admin') {
            throw new HttpError(400, 'Нельзя понизить свою роль');
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, role: true },
        });
        res.json(user);
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.get('/rules', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const { COMMUNITY_RULES } = await import('../constants/communityRules.js');
        res.json({
            rules: COMMUNITY_RULES,
            banPolicy: BAN_POLICY_TEXT,
        });
    }
    catch (error) {
        next(error);
    }
});

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

moderationRouter.get('/listings/:id', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const listingId = routeParam(req.params.id);
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            include: { user: listingUserSelect },
        });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        const author = listing.user;
        res.json({
            ...toListingResponse(listing, author),
            contentViolations: listingContentViolations(listing.title, listing.description),
            authorMeta: author ? {
                id: author.id,
                name: author.name,
                email: author.email,
                role: author.role,
                isBanned: author.isBanned,
            } : undefined,
        });
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
            status: z.enum(['published', 'rejected', 'pending']),
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

const adminEditListingSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    category: z.string().min(1).optional(),
    subcategory: z.string().min(1).optional(),
    priceFrom: z.number().positive().optional(),
    unit: z.enum(['час', 'день', 'м²', 'услуга', 'шт']).optional(),
    phone: z.string().min(10).optional(),
    imageIds: z.array(z.string()).max(10).optional(),
    status: z.enum(['pending', 'published', 'rejected']).optional(),
});

moderationRouter.patch('/listings/:id', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const listingId = routeParam(req.params.id);
        const data = adminEditListingSchema.parse(req.body);
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        const updated = await prisma.listing.update({
            where: { id: listingId },
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                subcategory: data.subcategory,
                priceFrom: data.priceFrom,
                unit: data.unit,
                phone: data.phone,
                images: data.imageIds ? JSON.stringify(data.imageIds) : undefined,
                status: data.status,
            },
            include: { user: listingUserSelect },
        });
        res.json({
            ...toListingResponse(updated, updated.user),
            contentViolations: listingContentViolations(updated.title, updated.description),
        });
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.delete('/listings/:id', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const listingId = routeParam(req.params.id);
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new HttpError(404, 'Объявление не найдено');
        }
        await prisma.report.deleteMany({ where: { listingId } });
        await prisma.listing.delete({ where: { id: listingId } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.patch('/users/:userId/unban', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const userId = routeParam(req.params.userId);
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                isBanned: false,
                bannedAt: null,
                banReason: null,
            },
        });
        res.json({
            id: user.id,
            isBanned: user.isBanned,
        });
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.patch('/users/:userId/ban', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const userId = routeParam(req.params.userId);
        const { reason } = z.object({
            reason: z.string().max(500).optional(),
        }).parse(req.body ?? {});
        const banned = await banUserAccount(userId, req.user!, reason ?? BAN_POLICY_TEXT);
        res.json({
            id: banned.id,
            isBanned: banned.isBanned,
            bannedAt: banned.bannedAt?.toISOString(),
            banReason: banned.banReason ?? undefined,
        });
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

moderationRouter.get('/reports/:id', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const reportId = routeParam(req.params.id);
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                listing: { include: { user: listingUserSelect } },
                reporter: { select: { name: true, email: true } },
            },
        });
        if (!report) {
            throw new HttpError(404, 'Жалоба не найдена');
        }
        res.json({
            id: report.id,
            listingId: report.listingId,
            listing: toListingResponse(report.listing, report.listing.user),
            authorMeta: {
                id: report.listing.user.id,
                name: report.listing.user.name,
                email: report.listing.user.email,
                role: report.listing.user.role,
                isBanned: report.listing.user.isBanned,
            },
            reporterName: report.reporter.name,
            reporterEmail: report.reporter.email,
            reason: report.reason ?? undefined,
            status: report.status,
            createdAt: report.createdAt.toISOString(),
        });
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.patch('/reports/:id', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const reportId = routeParam(req.params.id);
        const data = z.object({
            status: z.enum(['resolved', 'dismissed']),
            rejectListing: z.boolean().optional(),
            banAuthor: z.boolean().optional(),
            banReason: z.string().max(500).optional(),
        }).parse(req.body);
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { listing: true },
        });
        if (!report) {
            throw new HttpError(404, 'Жалоба не найдена');
        }
        if (data.rejectListing && report.listing.status !== 'rejected') {
            await prisma.listing.update({
                where: { id: report.listingId },
                data: { status: 'rejected' },
            });
        }
        if (data.banAuthor) {
            await banUserAccount(
                report.listing.userId,
                req.user!,
                data.banReason ?? BAN_POLICY_TEXT,
            );
        }
        const updated = await prisma.report.update({
            where: { id: reportId },
            data: { status: data.status },
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

async function recalculateListingRating(listingId: string) {
    const reviews = await prisma.review.findMany({ where: { listingId } });
    const reviewsCount = reviews.length;
    const rating = reviewsCount === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount;
    await prisma.listing.update({
        where: { id: listingId },
        data: { rating, reviewsCount },
    });
}

moderationRouter.patch('/reviews/:reviewId', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const reviewId = routeParam(req.params.reviewId);
        const data = z.object({
            text: z.string().min(10).max(2000).optional(),
            rating: z.number().int().min(1).max(5).optional(),
        }).parse(req.body);
        if (!data.text && data.rating === undefined) {
            throw new HttpError(400, 'Укажите текст или оценку');
        }
        if (data.text) {
            assertCleanContent(data.text);
        }
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) {
            throw new HttpError(404, 'Отзыв не найден');
        }
        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: {
                text: data.text,
                rating: data.rating,
            },
            include: { user: { select: { name: true } } },
        });
        await recalculateListingRating(review.listingId);
        const { toReviewResponse } = await import('../utils/mappers.js');
        res.json(toReviewResponse(updated));
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.delete('/reviews/:reviewId', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const reviewId = routeParam(req.params.reviewId);
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) {
            throw new HttpError(404, 'Отзыв не найден');
        }
        await prisma.review.delete({ where: { id: reviewId } });
        await recalculateListingRating(review.listingId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.patch('/forum/topics/:topicId', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const topicId = routeParam(req.params.topicId);
        const data = z.object({
            title: z.string().min(5).max(200).optional(),
            content: z.string().min(10).max(5000).optional(),
        }).parse(req.body);
        assertCleanContent(data.title, data.content);
        const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
        if (!topic) {
            throw new HttpError(404, 'Тема не найдена');
        }
        const updated = await prisma.forumTopic.update({
            where: { id: topicId },
            data: {
                title: data.title,
                content: data.content,
            },
        });
        res.json({
            id: updated.id,
            title: updated.title,
            content: updated.content,
        });
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.delete('/forum/topics/:topicId', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const topicId = routeParam(req.params.topicId);
        const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
        if (!topic) {
            throw new HttpError(404, 'Тема не найдена');
        }
        await prisma.forumTopic.delete({ where: { id: topicId } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.patch('/forum/posts/:postId', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const postId = routeParam(req.params.postId);
        const data = z.object({
            content: z.string().min(1).max(5000),
        }).parse(req.body);
        assertCleanContent(data.content);
        const post = await prisma.forumPost.findUnique({ where: { id: postId } });
        if (!post) {
            throw new HttpError(404, 'Комментарий не найден');
        }
        const updated = await prisma.forumPost.update({
            where: { id: postId },
            data: { content: data.content },
        });
        res.json({
            id: updated.id,
            content: updated.content,
        });
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.delete('/forum/posts/:postId', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const postId = routeParam(req.params.postId);
        const post = await prisma.forumPost.findUnique({ where: { id: postId } });
        if (!post) {
            throw new HttpError(404, 'Комментарий не найден');
        }
        await prisma.forumPost.delete({ where: { id: postId } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});

const siteNewsBodySchema = z.object({
    title: z.string().min(3).max(200),
    summary: z.string().max(2000).optional(),
    imageUrl: z.string().min(1).optional().nullable(),
    sourceUrl: z.string().min(1).optional().nullable(),
    publishedAt: z.string().datetime().optional(),
});

const siteNewsPatchSchema = siteNewsBodySchema.partial();

function toSiteNewsResponse(item: {
    id: string;
    title: string;
    summary: string;
    imageUrl: string | null;
    sourceUrl: string | null;
    publishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: item.id,
        title: item.title,
        summary: item.summary,
        imageUrl: item.imageUrl ?? undefined,
        sourceUrl: item.sourceUrl ?? undefined,
        publishedAt: item.publishedAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    };
}

moderationRouter.get('/site-news', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const items = await prisma.siteNews.findMany({
            orderBy: { publishedAt: 'desc' },
        });
        res.json(items.map(toSiteNewsResponse));
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.post('/site-news', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const data = siteNewsBodySchema.parse(req.body);
        const item = await prisma.siteNews.create({
            data: {
                title: data.title,
                summary: data.summary ?? '',
                imageUrl: data.imageUrl ?? null,
                sourceUrl: data.sourceUrl ?? null,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
            },
        });
        res.status(201).json(toSiteNewsResponse(item));
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.patch('/site-news/:id', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const newsId = routeParam(req.params.id);
        const data = siteNewsPatchSchema.parse(req.body);
        const existing = await prisma.siteNews.findUnique({ where: { id: newsId } });
        if (!existing) {
            throw new HttpError(404, 'Новость не найдена');
        }
        const item = await prisma.siteNews.update({
            where: { id: newsId },
            data: {
                title: data.title,
                summary: data.summary,
                imageUrl: data.imageUrl === undefined ? undefined : data.imageUrl,
                sourceUrl: data.sourceUrl === undefined ? undefined : data.sourceUrl,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
            },
        });
        res.json(toSiteNewsResponse(item));
    }
    catch (error) {
        next(error);
    }
});

moderationRouter.delete('/site-news/:id', async (req: AuthRequest, res, next) => {
    try {
        assertModerator(req.user!.role);
        const newsId = routeParam(req.params.id);
        const existing = await prisma.siteNews.findUnique({ where: { id: newsId } });
        if (!existing) {
            throw new HttpError(404, 'Новость не найдена');
        }
        await prisma.siteNews.delete({ where: { id: newsId } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});

export {
  moderationRouter,
};
