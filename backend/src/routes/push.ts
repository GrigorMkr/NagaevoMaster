import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { isPushConfigured, isWebPushConfigured } from '../services/push/webPush.js';
import { isFcmConfigured } from '../services/push/fcmPush.js';

const pushRouter = Router();

const subscribeSchema = z.object({
  endpoint: z.string().min(8),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  siteOrigin: z.string().url().optional(),
});

const MAX_SUBSCRIPTIONS_PER_USER = 5;

async function dedupePushSubscriptions(userId: string): Promise<number> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  const keepIds = new Set<string>();
  const seenKeys = new Set<string>();

  for (const sub of subscriptions) {
    const key = sub.userAgent ?? sub.endpoint;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      keepIds.add(sub.id);
    }
  }

  const staleIds = subscriptions
    .filter((sub) => !keepIds.has(sub.id))
    .map((sub) => sub.id);

  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: staleIds } },
    });
  }

  const remaining = subscriptions.filter((sub) => keepIds.has(sub.id));
  if (remaining.length <= MAX_SUBSCRIPTIONS_PER_USER) {
    return remaining.length;
  }

  const overflowIds = remaining
    .slice(MAX_SUBSCRIPTIONS_PER_USER)
    .map((sub) => sub.id);

  await prisma.pushSubscription.deleteMany({
    where: { id: { in: overflowIds } },
  });

  return MAX_SUBSCRIPTIONS_PER_USER;
}

pushRouter.get('/vapid-public-key', (_req, res) => {
  if (!env.VAPID_PUBLIC_KEY) {
    res.status(503).json({ message: 'Push-уведомления не настроены на сервере' });
    return;
  }
  res.json({ publicKey: env.VAPID_PUBLIC_KEY });
});

pushRouter.get('/status', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const count = await dedupePushSubscriptions(req.user!.id);
    res.json({
      configured: isPushConfigured(),
      webPushConfigured: isWebPushConfigured(),
      fcmConfigured: isFcmConfigured(),
      subscribed: count > 0,
    });
  } catch (error) {
    next(error);
  }
});

pushRouter.post('/subscribe', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = subscribeSchema.parse(req.body);
    const isNativeToken = data.endpoint.startsWith('fcm:');
    if (!isNativeToken && !isPushConfigured()) {
      throw new HttpError(503, 'Push-уведомления не настроены');
    }
    const userAgent = typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent'].slice(0, 255)
      : undefined;

    await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: req.user!.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
      },
      update: {
        userId: req.user!.id,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
      },
    });

    await dedupePushSubscriptions(req.user!.id);

    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

pushRouter.delete('/subscribe', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : '';
    if (!endpoint) {
      throw new HttpError(400, 'endpoint обязателен');
    }
    await prisma.pushSubscription.deleteMany({
      where: { userId: req.user!.id, endpoint },
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export {
  pushRouter,
};
