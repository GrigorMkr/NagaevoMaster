import { prisma } from '../lib/prisma.js';

/** Invalidate other devices/tabs by bumping the session version and return fresh user row. */
async function startUserSession(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

export {
  startUserSession,
};
