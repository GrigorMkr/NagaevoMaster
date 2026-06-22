import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const notificationsRouter = Router();

interface NotificationItem {
    id: string;
    type: 'forum_reply' | 'listing_published' | 'listing_rejected' | 'moderation_pending' | 'friend_request' | 'friend_accepted';
    title: string;
    message: string;
    link: string;
    createdAt: string;
}

notificationsRouter.get('/', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const role = req.user!.role;
        const items: NotificationItem[] = [];

        const incomingFriends = await prisma.friendship.findMany({
            where: {
                addresseeId: userId,
                status: 'pending',
            },
            include: {
                requester: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        for (const friendship of incomingFriends) {
            items.push({
                id: `friend-request-${friendship.id}`,
                type: 'friend_request',
                title: 'Заявка в друзья',
                message: `${friendship.requester.name} хочет добавить вас в друзья`,
                link: '/profile?section=friends',
                createdAt: friendship.createdAt.toISOString(),
            });
        }

        const recentAccepted = await prisma.friendship.findMany({
            where: {
                requesterId: userId,
                status: 'accepted',
                updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            include: {
                addressee: { select: { name: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 5,
        });

        for (const friendship of recentAccepted) {
            items.push({
                id: `friend-accepted-${friendship.id}`,
                type: 'friend_accepted',
                title: 'Заявка принята',
                message: `${friendship.addressee.name} принял(а) вашу заявку в друзья`,
                link: '/profile?section=friends',
                createdAt: friendship.updatedAt.toISOString(),
            });
        }

        const forumReplies = await prisma.forumPost.findMany({
            where: {
                topic: { authorId: userId },
                authorId: { not: userId },
            },
            include: {
                author: { select: { name: true } },
                topic: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 15,
        });

        for (const post of forumReplies) {
            items.push({
                id: `forum-${post.id}`,
                type: 'forum_reply',
                title: 'Ответ в вашей теме',
                message: `${post.author.name} ответил в «${post.topic.title}»`,
                link: `/forum/topic/${post.topic.id}`,
                createdAt: post.createdAt.toISOString(),
            });
        }

        const myListings = await prisma.listing.findMany({
            where: {
                userId,
                status: { in: ['published', 'rejected'] },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });

        for (const listing of myListings) {
            const isRecent = Date.now() - listing.updatedAt.getTime() < 30 * 24 * 60 * 60 * 1000;
            if (!isRecent) {
                continue;
            }
            if (listing.status === 'published') {
                items.push({
                    id: `listing-published-${listing.id}`,
                    type: 'listing_published',
                    title: 'Объявление опубликовано',
                    message: `«${listing.title}» прошло модерацию и доступно в каталоге`,
                    link: `/service/${listing.id}`,
                    createdAt: listing.updatedAt.toISOString(),
                });
            } else if (listing.status === 'rejected') {
                items.push({
                    id: `listing-rejected-${listing.id}`,
                    type: 'listing_rejected',
                    title: 'Объявление отклонено',
                    message: `«${listing.title}» не прошло модерацию. Проверьте текст и фото`,
                    link: '/profile',
                    createdAt: listing.updatedAt.toISOString(),
                });
            }
        }

        if (['moderator', 'admin'].includes(role)) {
            const pendingCount = await prisma.listing.count({ where: { status: 'pending' } });
            if (pendingCount > 0) {
                items.push({
                    id: 'moderation-queue',
                    type: 'moderation_pending',
                    title: 'Очередь модерации',
                    message: `${pendingCount} объявлений ждут проверки`,
                    link: '/profile',
                    createdAt: new Date().toISOString(),
                });
            }
        }

        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.json(items.slice(0, 30));
    }
    catch (error) {
        next(error);
    }
});

export {
  notificationsRouter,
}
