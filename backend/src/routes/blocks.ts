import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { routeParam } from '../utils/params.js';

const blocksRouter = Router();

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

function toBlockedUser(user: { id: string; name: string; email: string; avatarUrl: string | null }) {
  return {
    id: user.id,
    name: user.name,
    login: user.email.split('@')[0] ?? user.email,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

export async function assertUsersNotBlocked(userIdA: string, userIdB: string) {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  if (block) {
    throw new HttpError(403, 'Переписка с этим пользователем недоступна');
  }
}

blocksRouter.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: req.user!.id },
      include: { blocked: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(blocks.map((item) => ({
      id: item.id,
      user: toBlockedUser(item.blocked),
      createdAt: item.createdAt.toISOString(),
    })));
  } catch (error) {
    next(error);
  }
});

blocksRouter.get('/with/:userId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const targetUserId = routeParam(req.params.userId);
    const currentUserId = req.user!.id;
    const [blockedByMe, blockedMe] = await Promise.all([
      prisma.userBlock.findUnique({
        where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetUserId } },
      }),
      prisma.userBlock.findUnique({
        where: { blockerId_blockedId: { blockerId: targetUserId, blockedId: currentUserId } },
      }),
    ]);
    res.json({
      blockedByMe: !!blockedByMe,
      blockedMe: !!blockedMe,
      blockId: blockedByMe?.id,
    });
  } catch (error) {
    next(error);
  }
});

blocksRouter.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
    const blockerId = req.user!.id;
    if (userId === blockerId) {
      throw new HttpError(400, 'Нельзя заблокировать себя');
    }
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new HttpError(404, 'Пользователь не найден');
    }
    const block = await prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId: userId } },
      create: { blockerId, blockedId: userId },
      update: {},
      include: { blocked: { select: userSelect } },
    });
    res.status(201).json({
      id: block.id,
      user: toBlockedUser(block.blocked),
      createdAt: block.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

blocksRouter.delete('/:userId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const blockedId = routeParam(req.params.userId);
    await prisma.userBlock.deleteMany({
      where: { blockerId: req.user!.id, blockedId },
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export {
  blocksRouter,
}
