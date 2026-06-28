import { prisma } from '../lib/prisma.js';

const WELCOME_MESSAGE = 'Добро пожаловать. если понадобится помощь обращайтесь по любому вопросу.';

function orderedParticipants(userIdA: string, userIdB: string) {
  return userIdA < userIdB
    ? { participantLowId: userIdA, participantHighId: userIdB }
    : { participantLowId: userIdB, participantHighId: userIdA };
}

async function findSystemAdmin() {
  return prisma.user.findFirst({
    where: { role: 'admin', isBanned: false },
    orderBy: { createdAt: 'asc' },
  });
}

async function sendWelcomeMessageToUser(userId: string) {
  const admin = await findSystemAdmin();
  if (!admin || admin.id === userId) {
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.isBanned) {
    return;
  }

  const { participantLowId, participantHighId } = orderedParticipants(admin.id, userId);
  const conversation = await prisma.conversation.upsert({
    where: {
      participantLowId_participantHighId_type: {
        participantLowId,
        participantHighId,
        type: 'dm',
      },
    },
    create: {
      type: 'dm',
      participantLowId,
      participantHighId,
    },
    update: {},
  });

  const existing = await prisma.message.findFirst({
    where: {
      conversationId: conversation.id,
      senderId: admin.id,
      type: 'text',
      body: WELCOME_MESSAGE,
    },
    select: { id: true },
  });
  if (existing) {
    return;
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: admin.id,
      type: 'text',
      body: WELCOME_MESSAGE,
    },
  });
}

export {
  WELCOME_MESSAGE,
  findSystemAdmin,
  sendWelcomeMessageToUser,
};
