import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { routeParam } from '../utils/params.js';
import { assertCleanContent } from '../services/moderation/contentFilter.js';
import { assertOwnedUpload } from '../utils/uploadUrl.js';
import {
  assertActiveMember,
  assertCanAddMember,
  isGroupAdmin,
  mapGroupInfo,
  notifyGroupInvites,
} from '../services/groupConversation.js';
import { toMessageResponse as mapMessage } from './messagesShared.js';

const groupsRouter = Router();

const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  memberIds: z.array(z.string().uuid()).max(50).nullish().transform((value) => value ?? []),
  avatarUrl: z.union([z.string().max(500), z.literal('')]).optional().transform((value) => value || undefined),
});

groupsRouter.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const data = createGroupSchema.parse(req.body);
    assertCleanContent(data.name);
    if (data.avatarUrl) {
      assertOwnedUpload(data.avatarUrl);
    }

    const uniqueMemberIds = [...new Set(data.memberIds.filter((id) => id !== userId))];
    for (const memberId of uniqueMemberIds) {
      await assertCanAddMember(userId, memberId);
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const created = await tx.conversation.create({
        data: {
          type: 'group',
          name: data.name,
          avatarUrl: data.avatarUrl,
          createdById: userId,
          participantLowId: userId,
          participantHighId: userId,
          members: {
            create: [
              { userId, role: 'owner' },
              ...uniqueMemberIds.map((id) => ({ userId: id, role: 'member' })),
            ],
          },
        },
      });
      return created;
    });

    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (inviter) {
      void notifyGroupInvites({
        conversationId: conversation.id,
        groupName: data.name,
        inviterName: inviter.name,
        memberIds: uniqueMemberIds,
      });
    }

    res.status(201).json(await mapGroupInfo(conversation, userId));
  } catch (error) {
    next(error);
  }
});

groupsRouter.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const userId = req.user!.id;
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.type !== 'group') {
      throw new HttpError(404, 'Сообщество не найдено');
    }
    await assertActiveMember(conversationId, userId);
    res.json(await mapGroupInfo(conversation, userId));
  } catch (error) {
    next(error);
  }
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.union([z.string().max(500), z.literal('')]).nullable().optional().transform((value) => (value === '' ? null : value)),
});

groupsRouter.patch('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const userId = req.user!.id;
    const data = updateGroupSchema.parse(req.body);
    const member = await assertActiveMember(conversationId, userId);
    if (!isGroupAdmin(member.role)) {
      throw new HttpError(403, 'Только администратор может редактировать сообщество');
    }
    if (data.name) {
      assertCleanContent(data.name);
    }
    if (data.avatarUrl) {
      assertOwnedUpload(data.avatarUrl);
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: data.name?.trim(),
        avatarUrl: data.avatarUrl === null ? null : data.avatarUrl,
      },
    });
    res.json(await mapGroupInfo(updated, userId));
  } catch (error) {
    next(error);
  }
});

const addMembersSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1).max(20),
});

groupsRouter.post('/:id/members', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const userId = req.user!.id;
    const { memberIds } = addMembersSchema.parse(req.body);
    const member = await assertActiveMember(conversationId, userId);
    if (!isGroupAdmin(member.role)) {
      throw new HttpError(403, 'Только администратор может добавлять участников');
    }

    const uniqueIds = [...new Set(memberIds.filter((id) => id !== userId))];
    for (const targetId of uniqueIds) {
      await assertCanAddMember(userId, targetId);
    }

    const activeCount = await prisma.conversationMember.count({
      where: { conversationId, leftAt: null },
    });
    if (activeCount + uniqueIds.length > 100) {
      throw new HttpError(400, 'В сообществе не может быть больше 100 участников');
    }

    const addedMemberIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const targetId of uniqueIds) {
        const existing = await tx.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId: targetId } },
        });
        if (existing?.leftAt === null) continue;
        if (existing) {
          await tx.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId: targetId } },
            data: { leftAt: null, joinedAt: new Date(), role: 'member' },
          });
        } else {
          await tx.conversationMember.create({
            data: { conversationId, userId: targetId, role: 'member' },
          });
        }
        addedMemberIds.push(targetId);
      }
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    });

    const [conversation, inviter] = await Promise.all([
      prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);
    if (inviter && addedMemberIds.length > 0) {
      void notifyGroupInvites({
        conversationId,
        groupName: conversation.name ?? 'Сообщество',
        inviterName: inviter.name,
        memberIds: addedMemberIds,
      });
    }

    res.json(await mapGroupInfo(conversation, userId));
  } catch (error) {
    next(error);
  }
});

groupsRouter.delete('/:id/members/:userId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const targetUserId = routeParam(req.params.userId);
    const userId = req.user!.id;
    const member = await assertActiveMember(conversationId, userId);

    const isSelfLeave = targetUserId === userId;
    if (!isSelfLeave && !isGroupAdmin(member.role)) {
      throw new HttpError(403, 'Только администратор может удалять участников');
    }

    const target = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: targetUserId, leftAt: null },
    });
    if (!target) {
      throw new HttpError(404, 'Участник не найден');
    }
    if (target.role === 'owner' && !isSelfLeave) {
      throw new HttpError(403, 'Нельзя удалить создателя сообщества');
    }

    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
      data: { leftAt: new Date() },
    });

    if (isSelfLeave) {
      res.json({ left: true });
      return;
    }

    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    res.json(await mapGroupInfo(conversation, userId));
  } catch (error) {
    next(error);
  }
});

const reportGroupSchema = z.object({
  reason: z.string().max(1000).optional(),
});

groupsRouter.post('/:id/report', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const userId = req.user!.id;
    const { reason } = reportGroupSchema.parse(req.body);
    if (reason?.trim()) {
      assertCleanContent(reason);
    }
    await assertActiveMember(conversationId, userId);

    const existing = await prisma.groupReport.findFirst({
      where: { conversationId, reporterId: userId, status: 'pending' },
    });
    if (existing) {
      throw new HttpError(400, 'Жалоба уже отправлена');
    }

    await prisma.groupReport.create({
      data: {
        conversationId,
        reporterId: userId,
        reason: reason?.trim() || null,
      },
    });
    res.status(201).json({ reported: true });
  } catch (error) {
    next(error);
  }
});

groupsRouter.get('/:id/search', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const userId = req.user!.id;
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (query.length < 2) {
      throw new HttpError(400, 'Введите минимум 2 символа');
    }
    await assertActiveMember(conversationId, userId);

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        OR: [
          { body: { contains: query, mode: 'insensitive' } },
          { attachmentName: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        listing: {
          select: {
            id: true,
            title: true,
            kind: true,
            priceFrom: true,
            unit: true,
            images: true,
            status: true,
          },
        },
      },
    });

    res.json({
      query,
      results: messages.map((message) => mapMessage(message, userId)),
    });
  } catch (error) {
    next(error);
  }
});

export {
  groupsRouter,
};
