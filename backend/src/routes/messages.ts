import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { routeParam } from '../utils/params.js';
import { assertCleanContent } from '../services/moderation/contentFilter.js';
import { assertUsersNotBlocked } from '../routes/blocks.js';
import { sendMessagePush } from '../services/push/webPush.js';
import { recordListingRepost } from '../services/listingRepost.js';
import {
  assertActiveMember,
  canAccessConversation,
  countGroupUnread,
  getActiveMember,
  getGroupMembers,
  isGroupConversation,
  mapGroupInfo,
  notifyGroupMembers,
  participantSelect,
  toParticipant,
} from '../services/groupConversation.js';
import {
  MESSAGE_TYPES,
  type MessageType,
  assertOwnedUpload,
  formatMessagePreview,
  toMessageResponse,
  isStaffRole,
} from './messagesShared.js';

const messagesRouter = Router();

const listingMessageSelect = {
  id: true,
  title: true,
  kind: true,
  priceFrom: true,
  unit: true,
  images: true,
  status: true,
} as const;

function orderedParticipants(userIdA: string, userIdB: string) {
  return userIdA < userIdB
    ? { participantLowId: userIdA, participantHighId: userIdB }
    : { participantLowId: userIdB, participantHighId: userIdA };
}

function isParticipant(
  conversation: { participantLowId: string; participantHighId: string },
  userId: string,
) {
  return conversation.participantLowId === userId || conversation.participantHighId === userId;
}

function otherParticipantId(
  conversation: { participantLowId: string; participantHighId: string },
  userId: string,
) {
  return conversation.participantLowId === userId
    ? conversation.participantHighId
    : conversation.participantLowId;
}

function isSelfConversation(conversation: { participantLowId: string; participantHighId: string; type?: string }) {
  return conversation.type !== 'group' && conversation.participantLowId === conversation.participantHighId;
}

async function findConversationForUsers(userIdA: string, userIdB: string) {
  if (userIdA === userIdB) {
    return prisma.conversation.findFirst({
      where: {
        type: 'dm',
        participantLowId: userIdA,
        participantHighId: userIdA,
      },
    });
  }
  const { participantLowId, participantHighId } = orderedParticipants(userIdA, userIdB);
  return prisma.conversation.findUnique({
    where: {
      participantLowId_participantHighId_type: { participantLowId, participantHighId, type: 'dm' },
    },
  });
}

async function getOrCreateConversation(
  userIdA: string,
  userIdB: string,
  senderRole: string,
) {
  if (userIdA === userIdB) {
    const existingSelf = await prisma.conversation.findFirst({
      where: {
        type: 'dm',
        participantLowId: userIdA,
        participantHighId: userIdA,
      },
    });
    if (existingSelf) {
      return existingSelf;
    }
    return prisma.conversation.create({
      data: {
        type: 'dm',
        participantLowId: userIdA,
        participantHighId: userIdA,
      },
    });
  }
  await assertUsersNotBlocked(userIdA, userIdB);
  const target = await prisma.user.findUnique({ where: { id: userIdB } });
  if (!target) {
    throw new HttpError(404, 'Пользователь не найден');
  }
  if (target.isBanned) {
    throw new HttpError(403, 'Пользователь недоступен для переписки');
  }

  const existing = await findConversationForUsers(userIdA, userIdB);
  if (existing) {
    return existing;
  }

  const { participantLowId, participantHighId } = orderedParticipants(userIdA, userIdB);
  return prisma.conversation.create({
    data: { type: 'dm', participantLowId, participantHighId },
  });
}

async function mapConversationSummary(
  conversation: {
    id: string;
    type: string;
    name: string | null;
    avatarUrl: string | null;
    participantLowId: string;
    participantHighId: string;
    updatedAt: Date;
    participantLow: { id: string; name: string; email: string; avatarUrl: string | null; role: string };
    participantHigh: { id: string; name: string; email: string; avatarUrl: string | null; role: string };
    messages: {
      id: string;
      type: string;
      body: string;
      attachmentName: string | null;
      attachmentMime: string | null;
      senderId: string;
      createdAt: Date;
      readAt: Date | null;
      deletedAt?: Date | null;
    }[];
  },
  currentUserId: string,
) {
  const lastMessage = conversation.messages[0];
  const lastMessagePreview = lastMessage
    ? {
        id: lastMessage.id,
        type: lastMessage.type as MessageType,
        body: formatMessagePreview(lastMessage),
        senderId: lastMessage.senderId,
        createdAt: lastMessage.createdAt.toISOString(),
        isRead: lastMessage.readAt != null,
      }
    : undefined;

  if (isGroupConversation(conversation)) {
    const member = await getActiveMember(conversation.id, currentUserId);
    if (!member) return null;
    const members = await getGroupMembers(conversation.id);
    const unreadCount = await countGroupUnread(conversation.id, currentUserId);
    return {
      id: conversation.id,
      type: 'group' as const,
      group: {
        name: conversation.name ?? 'Сообщество',
        avatarUrl: conversation.avatarUrl ?? undefined,
        memberCount: members.length,
      },
      lastMessage: lastMessagePreview,
      unreadCount,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  const otherId = otherParticipantId(conversation, currentUserId);
  const isSelf = isSelfConversation(conversation);
  const otherUser = isSelf
    ? {
        ...toParticipant(conversation.participantLow),
        name: 'Себе',
        login: 'self',
      }
    : toParticipant(
        conversation.participantLowId === otherId
          ? conversation.participantLow
          : conversation.participantHigh,
      );
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: currentUserId },
      readAt: null,
    },
  });

  return {
    id: conversation.id,
    type: 'dm' as const,
    otherUser,
    lastMessage: lastMessagePreview,
    unreadCount,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

messagesRouter.get('/conversations', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const [dmConversations, groupMemberships] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          type: 'dm',
          OR: [{ participantLowId: userId }, { participantHighId: userId }],
        },
        include: {
          participantLow: { select: participantSelect },
          participantHigh: { select: participantSelect },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      prisma.conversationMember.findMany({
        where: { userId, leftAt: null, conversation: { type: 'group' } },
        include: {
          conversation: {
            include: {
              participantLow: { select: participantSelect },
              participantHigh: { select: participantSelect },
              messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
      }),
    ]);

    const allConversations = [
      ...dmConversations,
      ...groupMemberships.map((m) => m.conversation),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const items = (
      await Promise.all(
        allConversations.map((conversation) => mapConversationSummary(conversation, userId)),
      )
    ).filter((item): item is NonNullable<typeof item> => item != null);

    res.json(items);
  } catch (error) {
    next(error);
  }
});

messagesRouter.get('/unread-count', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const dmCount = await prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: {
          type: 'dm',
          OR: [{ participantLowId: userId }, { participantHighId: userId }],
        },
      },
    });
    const memberships = await prisma.conversationMember.findMany({
      where: { userId, leftAt: null },
      select: { conversationId: true, lastReadAt: true },
    });
    const groupCounts = await Promise.all(
      memberships.map((m) => countGroupUnread(m.conversationId, userId)),
    );
    const groupCount = groupCounts.reduce((sum, n) => sum + n, 0);
    res.json({ count: dmCount + groupCount });
  } catch (error) {
    next(error);
  }
});

const startConversationSchema = z.object({
  userId: z.string().uuid(),
});

messagesRouter.post('/conversations', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = startConversationSchema.parse(req.body);
    const existing = await findConversationForUsers(req.user!.id, data.userId);
    const conversation = existing ?? await getOrCreateConversation(
      req.user!.id,
      data.userId,
      req.user!.role,
    );
    const full = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: {
        participantLow: { select: participantSelect },
        participantHigh: { select: participantSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    res.status(existing ? 200 : 201).json(
      await mapConversationSummary(full, req.user!.id),
    );
  } catch (error) {
    next(error);
  }
});

messagesRouter.get('/conversations/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const userId = req.user!.id;
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participantLow: { select: participantSelect },
        participantHigh: { select: participantSelect },
      },
    });
    if (!conversation || !(await canAccessConversation(conversation, userId))) {
      throw new HttpError(404, 'Переписка не найдена');
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: participantSelect },
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

    if (isGroupConversation(conversation)) {
      res.json({
        id: conversation.id,
        type: 'group',
        group: await mapGroupInfo(conversation, userId),
        messages: messages.map((message) => toMessageResponse(message, userId)),
      });
      return;
    }

    const isSelf = isSelfConversation(conversation);
    const otherId = otherParticipantId(conversation, userId);
    const otherUser = isSelf
      ? {
          ...toParticipant(conversation.participantLow),
          name: 'Себе',
          login: 'self',
        }
      : toParticipant(
          conversation.participantLowId === otherId
            ? conversation.participantLow
            : conversation.participantHigh,
        );

    res.json({
      id: conversation.id,
      type: 'dm',
      otherUser,
      messages: messages.map((message) => toMessageResponse(message, userId)),
    });
  } catch (error) {
    next(error);
  }
});

const sendMessageSchema = z.object({
  type: z.enum(MESSAGE_TYPES).default('text'),
  body: z.string().max(4000).optional().default(''),
  attachmentUrl: z.string().min(1).max(500).optional(),
  attachmentName: z.string().max(255).optional(),
  attachmentMime: z.string().max(100).optional(),
  listingId: z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'listing') {
    if (!data.listingId) {
      ctx.addIssue({ code: 'custom', message: 'Укажите объявление' });
    }
    return;
  }
  if (data.type === 'text') {
    if (!data.body.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Введите текст сообщения' });
    }
    return;
  }
  if (!data.attachmentUrl) {
    ctx.addIssue({ code: 'custom', message: 'Вложение обязательно' });
  }
});

messagesRouter.post('/conversations/:id/messages', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const userId = req.user!.id;
    const data = sendMessageSchema.parse(req.body);
    if (data.body.trim()) {
      assertCleanContent(data.body);
    }
    if (data.attachmentUrl) {
      assertOwnedUpload(data.attachmentUrl);
    }

    if (data.type === 'listing' && data.listingId) {
      const listing = await prisma.listing.findFirst({
        where: { id: data.listingId, status: 'published' },
      });
      if (!listing) {
        throw new HttpError(404, 'Объявление не найдено');
      }
    }

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || !(await canAccessConversation(conversation, userId))) {
      throw new HttpError(404, 'Переписка не найдена');
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          type: data.type,
          body: data.body.trim(),
          attachmentUrl: data.attachmentUrl,
          attachmentName: data.attachmentName,
          attachmentMime: data.attachmentMime,
          listingId: data.type === 'listing' ? data.listingId : undefined,
        },
        include: {
          sender: { select: participantSelect },
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
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return created;
    });

    if (isGroupConversation(conversation)) {
      void notifyGroupMembers({
        conversationId,
        senderId: userId,
        senderName: message.sender.name,
        groupName: conversation.name ?? 'Сообщество',
        preview: formatMessagePreview(message),
        messageId: message.id,
      });
    } else {
      const recipientId = otherParticipantId(conversation, userId);
      if (!isSelfConversation(conversation)) {
        void sendMessagePush({
          recipientUserId: recipientId,
          senderName: message.sender.name,
          preview: formatMessagePreview(message),
          conversationId,
          messageId: message.id,
        }).catch(() => undefined);
      }
    }

    res.status(201).json(toMessageResponse(message, userId));
  } catch (error) {
    next(error);
  }
});

messagesRouter.patch('/conversations/:id/read', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conversationId = routeParam(req.params.id);
    const userId = req.user!.id;
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || !(await canAccessConversation(conversation, userId))) {
      throw new HttpError(404, 'Переписка не найдена');
    }

    if (isGroupConversation(conversation)) {
      await prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: new Date() },
      });
      res.json({ marked: 0 });
      return;
    }

    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({ marked: result.count });
  } catch (error) {
    next(error);
  }
});

async function getMessageForParticipant(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: true,
      sender: { select: participantSelect },
    },
  });
  if (!message || !(await canAccessConversation(message.conversation, userId))) {
    throw new HttpError(404, 'Сообщение не найдено');
  }
  return message;
}

const editMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

messagesRouter.patch('/items/:messageId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const messageId = routeParam(req.params.messageId);
    const userId = req.user!.id;
    const { body } = editMessageSchema.parse(req.body);
    assertCleanContent(body);

    const message = await getMessageForParticipant(messageId, userId);
    if (message.senderId !== userId) {
      throw new HttpError(403, 'Можно редактировать только свои сообщения');
    }
    if (message.deletedAt) {
      throw new HttpError(400, 'Сообщение удалено');
    }
    if (message.type !== 'text') {
      throw new HttpError(400, 'Редактировать можно только текст');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        body: body.trim(),
        editedAt: new Date(),
      },
      include: {
        sender: { select: participantSelect },
      },
    });

    res.json(toMessageResponse(updated, userId));
  } catch (error) {
    next(error);
  }
});

messagesRouter.delete('/items/:messageId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const messageId = routeParam(req.params.messageId);
    const userId = req.user!.id;
    const message = await getMessageForParticipant(messageId, userId);
    if (message.senderId !== userId) {
      throw new HttpError(403, 'Можно удалять только свои сообщения');
    }
    if (message.deletedAt) {
      res.json(toMessageResponse(message, userId));
      return;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      include: {
        sender: { select: participantSelect },
      },
    });

    res.json(toMessageResponse(updated, userId));
  } catch (error) {
    next(error);
  }
});

const forwardMessageSchema = z.object({
  conversationId: z.string().uuid(),
});

messagesRouter.post('/items/:messageId/forward', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const messageId = routeParam(req.params.messageId);
    const userId = req.user!.id;
    const { conversationId } = forwardMessageSchema.parse(req.body);

    const source = await getMessageForParticipant(messageId, userId);
    if (source.deletedAt) {
      throw new HttpError(400, 'Нельзя переслать удалённое сообщение');
    }

    const targetConversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!targetConversation || !(await canAccessConversation(targetConversation, userId))) {
      throw new HttpError(404, 'Переписка не найдена');
    }

    if (!isGroupConversation(targetConversation)) {
      const recipientId = otherParticipantId(targetConversation, userId);
      await assertUsersNotBlocked(userId, recipientId);
    }

    if (source.type === 'listing') {
      if (!source.listingId) {
        throw new HttpError(400, 'Объявление недоступно для пересылки');
      }
      const listing = await prisma.listing.findFirst({
        where: { id: source.listingId, status: 'published' },
      });
      if (!listing) {
        throw new HttpError(404, 'Объявление не найдено или снято с публикации');
      }
    }

    const forwarded = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          type: source.type,
          body: source.body,
          attachmentUrl: source.attachmentUrl,
          attachmentName: source.attachmentName,
          attachmentMime: source.attachmentMime,
          listingId: source.type === 'listing' ? source.listingId : undefined,
          isForwarded: true,
        },
        include: {
          sender: { select: participantSelect },
          listing: { select: listingMessageSelect },
        },
      });

      if (source.type === 'listing' && source.listingId && !isGroupConversation(targetConversation)) {
        const recipientId = otherParticipantId(targetConversation, userId);
        await recordListingRepost(tx, {
          listingId: source.listingId,
          senderId: userId,
          recipientId,
        });
      }

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return created;
    });

    if (isGroupConversation(targetConversation)) {
      void notifyGroupMembers({
        conversationId,
        senderId: userId,
        senderName: forwarded.sender.name,
        groupName: targetConversation.name ?? 'Сообщество',
        preview: formatMessagePreview(forwarded),
        messageId: forwarded.id,
      });
    } else {
      const recipientId = otherParticipantId(targetConversation, userId);
      void sendMessagePush({
        recipientUserId: recipientId,
        senderName: forwarded.sender.name,
        preview: formatMessagePreview(forwarded),
        conversationId,
        messageId: forwarded.id,
      }).catch(() => undefined);
    }

    res.status(201).json(toMessageResponse(forwarded, userId));
  } catch (error) {
    next(error);
  }
});

export {
  messagesRouter,
}
