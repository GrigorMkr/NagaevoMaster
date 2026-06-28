import { prisma } from '../lib/prisma.js';
import { getOnlineUserIds } from './presence.js';
import { WELCOME_MESSAGE, findSystemAdmin } from './welcomeMessage.js';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatLogin(email: string): string {
  return email.split('@')[0]?.replace(/\./g, '_') ?? email;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  isBanned: true,
} as const;

async function getWelcomedUserIds(adminId: string, userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) {
    return new Set();
  }

  const messages = await prisma.message.findMany({
    where: {
      senderId: adminId,
      type: 'text',
      body: WELCOME_MESSAGE,
      conversation: {
        type: 'dm',
        OR: [
          { participantLowId: adminId, participantHighId: { in: userIds } },
          { participantHighId: adminId, participantLowId: { in: userIds } },
        ],
      },
    },
    select: {
      conversation: {
        select: {
          participantLowId: true,
          participantHighId: true,
        },
      },
    },
  });

  const welcomed = new Set<string>();
  for (const message of messages) {
    const { participantLowId, participantHighId } = message.conversation;
    welcomed.add(participantLowId === adminId ? participantHighId : participantLowId);
  }
  return welcomed;
}

async function getAdminNetworkUsers() {
  const today = startOfToday();
  const onlineIds = getOnlineUserIds();
  const onlineIdSet = new Set(onlineIds);
  const admin = await findSystemAdmin();

  const [onlineUsers, newUsers] = await Promise.all([
    onlineIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: onlineIds }, isBanned: false },
          select: userSelect,
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: { createdAt: { gte: today }, isBanned: false },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const allIds = [...new Set([...onlineUsers.map((user) => user.id), ...newUsers.map((user) => user.id)])];
  const welcomedSet = admin ? await getWelcomedUserIds(admin.id, allIds) : new Set<string>();

  const mapUser = (user: typeof onlineUsers[number], isOnline: boolean) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    login: formatLogin(user.email),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    isOnline,
    welcomeSent: welcomedSet.has(user.id),
  });

  return {
    generatedAt: new Date().toISOString(),
    online: onlineUsers.map((user) => mapUser(user, true)),
    newUsers: newUsers.map((user) => mapUser(user, onlineIdSet.has(user.id))),
  };
}

export {
  getAdminNetworkUsers,
};
