import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { routeParam } from '../utils/params.js';
import { assertCleanContent } from '../services/moderation/contentFilter.js';
import { assertUsersNotBlocked } from '../routes/blocks.js';
import { env } from '../config/env.js';
import { sendMessagePush } from '../services/push/webPush.js';
import { recordListingRepost } from '../services/listingRepost.js';

const messagesRouter = Router();

const MESSAGE_TYPES = ['text', 'file', 'voice', 'listing'] as const;
type MessageType = (typeof MESSAGE_TYPES)[number];

const participantSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  role: true,
} as const;

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

function isStaffRole(role: string) {
  return role === 'admin' || role === 'moderator';
}

function toParticipant(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    login: user.email.split('@')[0] ?? user.email,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    isStaff: isStaffRole(user.role),
  };
}

function isSelfConversation(conversation: { participantLowId: string; participantHighId: string }) {
  return conversation.participantLowId === conversation.participantHighId;
}

function formatMessagePreview(message: {
  type: string;
  body: string;
  attachmentName: string | null;
  attachmentMime: string | null;
  deletedAt?: Date | null;
}) {
  if (message.deletedAt) {
    return 'Сообщение удалено';
  }
  if (message.type === 'listing') {
    return 'Объявление';
  }
  if (message.type === 'voice') {
    return 'Голосовое сообщение';
  }
  if (message.type === 'file') {
    if (message.attachmentMime?.startsWith('image/')) {
      return 'Фото';
    }
    return message.attachmentName || 'Файл';
  }
  return message.body;
}

function assertOwnedUpload(url: string) {
  const prefix = env.PUBLIC_UPLOAD_URL.endsWith('/')
    ? env.PUBLIC_UPLOAD_URL
    : `${env.PUBLIC_UPLOAD_URL}/`;
  if (!url.startsWith(prefix)) {
    throw new HttpError(400, 'Некорректная ссылка на вложение');
  }
}

function toMessageResponse(
  message: {
    id: string;
    type: string;
    body: string;
    attachmentUrl: string | null;
    attachmentName: string | null;
    attachmentMime: string | null;
    senderId: string;
    sender: { name: string; role: string };
    createdAt: Date;
    readAt: Date | null;
    editedAt?: Date | null;
    deletedAt?: Date | null;
    isForwarded?: boolean;
    listingId?: string | null;
    listing?: {
      id: string;
      title: string;
      kind: string;
      priceFrom: number;
      unit: string;
      images: string;
      status: string;
    } | null;
  },
  currentUserId: string,
) {
  const isDeleted = message.deletedAt != null;
  let listingPreview: {
    id: string;
    title: string;
    kind: string;
    priceFrom: number;
    unit: string;
    image?: string;
  } | undefined;
  if (!isDeleted && message.type === 'listing' && message.listing && message.listing.status === 'published') {
    let images: string[] = [];
    try {
      const parsed = JSON.parse(message.listing.images) as unknown;
      images = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      images = [];
    }
    listingPreview = {
      id: message.listing.id,
      title: message.listing.title,
      kind: message.listing.kind,
      priceFrom: message.listing.priceFrom,
      unit: message.listing.unit,
      image: images[0],
    };
  }
  return {
    id: message.id,
    type: message.type as MessageType,
    body: isDeleted ? '' : message.body,
    attachmentUrl: isDeleted ? undefined : (message.attachmentUrl ?? undefined),
    attachmentName: isDeleted ? undefined : (message.attachmentName ?? undefined),
    attachmentMime: isDeleted ? undefined : (message.attachmentMime ?? undefined),
    listingId: isDeleted ? undefined : (message.listingId ?? undefined),
    listingPreview,
    senderId: message.senderId,
    senderName: message.sender.name,
    senderRole: message.sender.role,
    senderIsStaff: isStaffRole(message.sender.role),
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString(),
    editedAt: message.editedAt?.toISOString(),
    isDeleted,
    isForwarded: Boolean(message.isForwarded),
    isMine: message.senderId === currentUserId,
  };
}

async function findConversationForUsers(userIdA: string, userIdB: string) {
  if (userIdA === userIdB) {
    return prisma.conversation.findFirst({
      where: {
        participantLowId: userIdA,
        participantHighId: userIdA,
      },
    });
  }
  const { participantLowId, participantHighId } = orderedParticipants(userIdA, userIdB);
  return prisma.conversation.findUnique({
    where: {
      participantLowId_participantHighId: { participantLowId, participantHighId },
    },
  });
}

async function findAcceptedFriendship(userIdA: string, userIdB: string) {
  return prisma.friendship.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA },
      ],
    },
  });
}

async function assertCanStartConversation(
  senderId: string,
  targetId: string,
  senderRole: string,
) {
  if (isStaffRole(senderRole)) {
    return;
  }
  const friendship = await findAcceptedFriendship(senderId, targetId);
  if (friendship) {
    return;
  }
  const existing = await findConversationForUsers(senderId, targetId);
  if (existing) {
    return;
  }
  const publishedListing = await prisma.listing.findFirst({
    where: { userId: targetId, status: 'published' },
    select: { id: true },
  });
  if (publishedListing) {
    return;
  }
  throw new HttpError(403, 'Добавьте пользователя в друзья, чтобы начать переписку');
}

async function getOrCreateConversation(
  userIdA: string,
  userIdB: string,
  senderRole: string,
) {
  if (userIdA === userIdB) {
    const existingSelf = await prisma.conversation.findFirst({
      where: {
        participantLowId: userIdA,
        participantHighId: userIdA,
      },
    });
    if (existingSelf) {
      return existingSelf;
    }
    return prisma.conversation.create({
      data: {
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

  await assertCanStartConversation(userIdA, userIdB, senderRole);

  const { participantLowId, participantHighId } = orderedParticipants(userIdA, userIdB);
  return prisma.conversation.create({
    data: { participantLowId, participantHighId },
  });
}

async function mapConversationSummary(
  conversation: {
    id: string;
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
  const lastMessage = conversation.messages[0];
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: currentUserId },
      readAt: null,
    },
  });

  return {
    id: conversation.id,
    otherUser,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          type: lastMessage.type as MessageType,
          body: formatMessagePreview(lastMessage),
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt.toISOString(),
          isRead: lastMessage.readAt != null,
        }
      : undefined,
    unreadCount,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

messagesRouter.get('/conversations', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participantLowId: userId }, { participantHighId: userId }],
      },
      include: {
        participantLow: { select: participantSelect },
        participantHigh: { select: participantSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const items = await Promise.all(
      conversations.map((conversation) => mapConversationSummary(conversation, userId)),
    );
    res.json(items);
  } catch (error) {
    next(error);
  }
});

messagesRouter.get('/unread-count', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const count = await prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: {
          OR: [{ participantLowId: userId }, { participantHighId: userId }],
        },
      },
    });
    res.json({ count });
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
    if (!conversation || !isParticipant(conversation, userId)) {
      throw new HttpError(404, 'Переписка не найдена');
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

    res.json({
      id: conversation.id,
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
    if (!conversation || !isParticipant(conversation, userId)) {
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
    if (!conversation || !isParticipant(conversation, userId)) {
      throw new HttpError(404, 'Переписка не найдена');
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
  if (!message || !isParticipant(message.conversation, userId)) {
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
    if (!targetConversation || !isParticipant(targetConversation, userId)) {
      throw new HttpError(404, 'Переписка не найдена');
    }

    const recipientId = otherParticipantId(targetConversation, userId);
    await assertUsersNotBlocked(userId, recipientId);

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

      if (source.type === 'listing' && source.listingId) {
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

    void sendMessagePush({
      recipientUserId: recipientId,
      senderName: forwarded.sender.name,
      preview: formatMessagePreview(forwarded),
      conversationId,
      messageId: forwarded.id,
    }).catch(() => undefined);

    res.status(201).json(toMessageResponse(forwarded, userId));
  } catch (error) {
    next(error);
  }
});

export {
  messagesRouter,
}
