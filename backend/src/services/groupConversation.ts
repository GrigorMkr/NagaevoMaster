import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { assertUsersNotBlocked } from '../routes/blocks.js';
import { sendGroupInvitePush, sendMessagePush } from '../services/push/webPush.js';

const participantSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  role: true,
} as const;

type ParticipantUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

function isStaffRole(role: string) {
  return role === 'admin' || role === 'moderator';
}

function toParticipant(user: ParticipantUser) {
  return {
    id: user.id,
    name: user.name,
    login: user.email.split('@')[0] ?? user.email,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    isStaff: isStaffRole(user.role),
  };
}

function isGroupConversation(conversation: { type: string }) {
  return conversation.type === 'group';
}

async function getActiveMember(conversationId: string, userId: string) {
  return prisma.conversationMember.findFirst({
    where: {
      conversationId,
      userId,
      leftAt: null,
    },
    include: {
      user: { select: participantSelect },
    },
  });
}

async function assertActiveMember(conversationId: string, userId: string) {
  const member = await getActiveMember(conversationId, userId);
  if (!member) {
    throw new HttpError(404, 'Сообщество не найдено');
  }
  return member;
}

function isGroupAdmin(role: string) {
  return role === 'owner' || role === 'admin';
}

async function canAccessConversation(
  conversation: { id: string; type: string; participantLowId: string; participantHighId: string },
  userId: string,
) {
  if (isGroupConversation(conversation)) {
    const member = await getActiveMember(conversation.id, userId);
    return Boolean(member);
  }
  return conversation.participantLowId === userId || conversation.participantHighId === userId;
}

async function countGroupUnread(conversationId: string, userId: string) {
  const member = await getActiveMember(conversationId, userId);
  if (!member) return 0;
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      deletedAt: null,
      createdAt: member.lastReadAt ? { gt: member.lastReadAt } : undefined,
    },
  });
}

async function getGroupMembers(conversationId: string) {
  return prisma.conversationMember.findMany({
    where: { conversationId, leftAt: null },
    include: { user: { select: participantSelect } },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  });
}

function mapGroupMember(member: {
  userId: string;
  role: string;
  joinedAt: Date;
  user: ParticipantUser;
}) {
  return {
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    user: toParticipant(member.user),
  };
}

async function mapGroupInfo(conversation: {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  createdById: string | null;
}, userId: string) {
  const members = await getGroupMembers(conversation.id);
  const myMember = members.find((m) => m.userId === userId);
  return {
    id: conversation.id,
    name: conversation.name ?? 'Сообщество',
    avatarUrl: conversation.avatarUrl ?? undefined,
    memberCount: members.length,
    createdById: conversation.createdById ?? undefined,
    myRole: myMember?.role ?? 'member',
    members: members.map(mapGroupMember),
  };
}

async function notifyGroupMembers(options: {
  conversationId: string;
  senderId: string;
  senderName: string;
  groupName: string;
  preview: string;
  messageId: string;
}) {
  const members = await prisma.conversationMember.findMany({
    where: {
      conversationId: options.conversationId,
      leftAt: null,
      userId: { not: options.senderId },
    },
    select: { userId: true },
  });

  await Promise.all(
    members.map((member) =>
      sendMessagePush({
        recipientUserId: member.userId,
        senderName: `${options.groupName}: ${options.senderName}`,
        preview: options.preview,
        conversationId: options.conversationId,
        messageId: options.messageId,
      }).catch(() => undefined),
    ),
  );
}

async function assertCanAddMember(adderId: string, targetId: string) {
  if (adderId === targetId) {
    throw new HttpError(400, 'Нельзя добавить себя в сообщество');
  }
  await assertUsersNotBlocked(adderId, targetId);
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.isBanned) {
    throw new HttpError(404, 'Пользователь недоступен');
  }
}

async function notifyGroupInvites(options: {
  conversationId: string;
  groupName: string;
  inviterName: string;
  memberIds: string[];
}) {
  const uniqueIds = [...new Set(options.memberIds)];
  await Promise.all(
    uniqueIds.map((recipientUserId) =>
      sendGroupInvitePush({
        recipientUserId,
        inviterName: options.inviterName,
        groupName: options.groupName,
        conversationId: options.conversationId,
      }).catch(() => undefined),
    ),
  );
}

export {
  participantSelect,
  toParticipant,
  isGroupConversation,
  getActiveMember,
  assertActiveMember,
  isGroupAdmin,
  canAccessConversation,
  countGroupUnread,
  getGroupMembers,
  mapGroupMember,
  mapGroupInfo,
  notifyGroupMembers,
  notifyGroupInvites,
  assertCanAddMember,
  isStaffRole,
};
