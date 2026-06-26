import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { routeParam } from '../utils/params.js';
import { sendFriendPush } from '../services/push/webPush.js';
import { isBirthdayToday } from '../utils/birthDate.js';

const friendsRouter = Router();

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

const friendUserSelect = {
  ...userSelect,
  birthDate: true,
} as const;

function toFriendUser(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  birthDate?: Date | null;
}, options?: { includeBirthdayFlag?: boolean }) {
  return {
    id: user.id,
    name: user.name,
    login: user.email.split('@')[0] ?? user.email,
    avatarUrl: user.avatarUrl ?? undefined,
    ...(options?.includeBirthdayFlag
      ? { birthdayToday: isBirthdayToday(user.birthDate) }
      : {}),
  };
}

function mapFriendship(
  friendship: {
    id: string;
    status: string;
    requesterId: string;
    addresseeId: string;
    createdAt: Date;
    requester: { id: string; name: string; email: string; avatarUrl: string | null; birthDate?: Date | null };
    addressee: { id: string; name: string; email: string; avatarUrl: string | null; birthDate?: Date | null };
  },
  currentUserId: string,
) {
  const isIncoming = friendship.addresseeId === currentUserId;
  const other = isIncoming ? friendship.requester : friendship.addressee;
  return {
    id: friendship.id,
    status: friendship.status,
    direction: isIncoming ? 'incoming' as const : 'outgoing' as const,
    user: toFriendUser(other, { includeBirthdayFlag: friendship.status === 'accepted' }),
    createdAt: friendship.createdAt.toISOString(),
  };
}

async function findFriendshipBetween(userIdA: string, userIdB: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA },
      ],
    },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });
}

friendsRouter.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: friendUserSelect },
        addressee: { select: friendUserSelect },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const friends = friendships
      .filter((item) => item.status === 'accepted')
      .map((item) => mapFriendship(item, userId));
    const incoming = friendships
      .filter((item) => item.status === 'pending' && item.addresseeId === userId)
      .map((item) => mapFriendship(item, userId));
    const outgoing = friendships
      .filter((item) => item.status === 'pending' && item.requesterId === userId)
      .map((item) => mapFriendship(item, userId));

    res.json({ friends, incoming, outgoing });
  } catch (error) {
    next(error);
  }
});

friendsRouter.get('/search', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const query = rawQuery.replace(/^@+/, '').trim();
    if (query.length < 2) {
      res.json([]);
      return;
    }

    const userId = req.user!.id;
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isBanned: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: userSelect,
      take: 10,
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(users.map(async (user) => {
      const friendship = await findFriendshipBetween(userId, user.id);
      let relation: 'none' | 'friends' | 'pending_sent' | 'pending_received' = 'none';
      let friendshipId: string | undefined;
      if (friendship) {
        friendshipId = friendship.id;
        if (friendship.status === 'accepted') {
          relation = 'friends';
        } else if (friendship.requesterId === userId) {
          relation = 'pending_sent';
        } else {
          relation = 'pending_received';
        }
      }
      return {
        ...toFriendUser(user),
        relation,
        friendshipId,
      };
    }));

    res.json(results);
  } catch (error) {
    next(error);
  }
});

friendsRouter.get('/with/:userId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const targetUserId = routeParam(req.params.userId);
    const friendship = await findFriendshipBetween(req.user!.id, targetUserId);
    if (!friendship) {
      res.json({ relation: 'none' as const });
      return;
    }
    if (friendship.status === 'accepted') {
      res.json({ relation: 'friends' as const, friendshipId: friendship.id });
      return;
    }
    if (friendship.requesterId === req.user!.id) {
      res.json({ relation: 'pending_sent' as const, friendshipId: friendship.id });
      return;
    }
    res.json({ relation: 'pending_received' as const, friendshipId: friendship.id });
  } catch (error) {
    next(error);
  }
});

const requestSchema = z.object({
  userId: z.string().uuid(),
});

friendsRouter.post('/request', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = requestSchema.parse(req.body);
    const currentUserId = req.user!.id;
    if (userId === currentUserId) {
      throw new HttpError(400, 'Нельзя добавить себя в друзья');
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.isBanned) {
      throw new HttpError(404, 'Пользователь не найден');
    }

    const existing = await findFriendshipBetween(currentUserId, userId);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new HttpError(400, 'Пользователь уже в друзьях');
      }
      if (existing.requesterId === currentUserId) {
        throw new HttpError(400, 'Заявка уже отправлена');
      }
      const accepted = await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: 'accepted', updatedAt: new Date() },
        include: {
          requester: { select: userSelect },
          addressee: { select: userSelect },
        },
      });
      void sendFriendPush({
        recipientUserId: existing.requesterId,
        senderName: req.user!.name,
        kind: 'friend_accepted',
      }).catch(() => undefined);
      res.status(200).json(mapFriendship(accepted, currentUserId));
      return;
    }

    const created = await prisma.friendship.create({
      data: {
        requesterId: currentUserId,
        addresseeId: userId,
      },
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    });
    void sendFriendPush({
      recipientUserId: userId,
      senderName: req.user!.name,
      kind: 'friend_request',
    }).catch(() => undefined);
    res.status(201).json(mapFriendship(created, currentUserId));
  } catch (error) {
    next(error);
  }
});

friendsRouter.post('/:id/accept', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const friendshipId = routeParam(req.params.id);
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    });
    if (!friendship || friendship.addresseeId !== req.user!.id) {
      throw new HttpError(404, 'Заявка не найдена');
    }
    if (friendship.status !== 'pending') {
      throw new HttpError(400, 'Заявка уже обработана');
    }

    const accepted = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted', updatedAt: new Date() },
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    });
    void sendFriendPush({
      recipientUserId: friendship.requesterId,
      senderName: req.user!.name,
      kind: 'friend_accepted',
    }).catch(() => undefined);
    res.json(mapFriendship(accepted, req.user!.id));
  } catch (error) {
    next(error);
  }
});

friendsRouter.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const friendshipId = routeParam(req.params.id);
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) {
      throw new HttpError(404, 'Запись не найдена');
    }
    const userId = req.user!.id;
    const isParticipant = friendship.requesterId === userId || friendship.addresseeId === userId;
    if (!isParticipant) {
      throw new HttpError(403, 'Нет доступа');
    }
    if (friendship.status === 'pending' && friendship.addresseeId !== userId && friendship.requesterId !== userId) {
      throw new HttpError(403, 'Нет доступа');
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export {
  friendsRouter,
}
