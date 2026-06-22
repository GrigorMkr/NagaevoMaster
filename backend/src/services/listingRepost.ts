import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { assertUsersNotBlocked } from '../routes/blocks.js';

function orderedParticipants(userIdA: string, userIdB: string) {
  return userIdA < userIdB
    ? { participantLowId: userIdA, participantHighId: userIdB }
    : { participantLowId: userIdB, participantHighId: userIdA };
}

function isStaffRole(role: string) {
  return role === 'admin' || role === 'moderator';
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
  if (senderId === targetId) {
    return;
  }
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

type TxClient = Prisma.TransactionClient;

async function getOrCreateConversationForUsers(
  tx: TxClient,
  userIdA: string,
  userIdB: string,
  senderRole: string,
) {
  if (userIdA === userIdB) {
    const existingSelf = await tx.conversation.findFirst({
      where: {
        participantLowId: userIdA,
        participantHighId: userIdA,
      },
    });
    if (existingSelf) {
      return existingSelf;
    }
    return tx.conversation.create({
      data: {
        participantLowId: userIdA,
        participantHighId: userIdA,
      },
    });
  }

  await assertUsersNotBlocked(userIdA, userIdB);
  const target = await tx.user.findUnique({ where: { id: userIdB } });
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
  return tx.conversation.create({
    data: { participantLowId, participantHighId },
  });
}

async function sendListingMessage(
  tx: TxClient,
  params: {
    conversationId: string;
    senderId: string;
    listingId: string;
  },
) {
  const message = await tx.message.create({
    data: {
      conversationId: params.conversationId,
      senderId: params.senderId,
      type: 'listing',
      body: '',
      listingId: params.listingId,
    },
  });
  await tx.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });
  return message;
}

async function recordListingRepost(
  tx: TxClient,
  params: {
    listingId: string;
    senderId: string;
    recipientId: string;
  },
) {
  await tx.listingRepost.create({
    data: {
      listingId: params.listingId,
      senderId: params.senderId,
      recipientId: params.recipientId,
    },
  });
  await tx.listing.update({
    where: { id: params.listingId },
    data: { repostsCount: { increment: 1 } },
  });
}

export {
  getOrCreateConversationForUsers,
  sendListingMessage,
  recordListingRepost,
  findConversationForUsers,
};
