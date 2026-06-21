import webpush from 'web-push';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { extractFcmToken, isFcmEndpoint, sendFcmMessage, type MessagePushPayload } from './fcmPush.js';

let configured = false;

function ensureWebPush() {
  if (configured) return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

function isPushConfigured(): boolean {
  return Boolean(
    (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY)
    || env.FCM_SERVER_KEY,
  );
}

async function sendMessagePush(payload: MessagePushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: payload.recipientUserId },
    orderBy: { updatedAt: 'desc' },
  });
  if (subscriptions.length === 0) {
    console.info('[push] no subscriptions for user', payload.recipientUserId);
    return;
  }

  const body = {
    title: payload.senderName,
    body: payload.preview,
    senderName: payload.senderName,
    messageId: payload.messageId,
    url: `/profile?section=messages&chat=${payload.conversationId}`,
    tag: `message-${payload.messageId}`,
    icon: '/apple-touch-icon.png',
  };

  const pushPayload = JSON.stringify(body);

  await Promise.all(subscriptions.map(async (sub) => {
    if (isFcmEndpoint(sub.endpoint)) {
      const ok = await sendFcmMessage(extractFcmToken(sub.endpoint), payload);
      if (!ok) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      }
      return;
    }

    if (!ensureWebPush()) return;

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload,
        {
          TTL: 60 * 60 * 24,
          urgency: 'high',
          topic: `message-${payload.messageId}`,
        },
      );
      console.info('[push] sent', {
        userId: payload.recipientUserId,
        messageId: payload.messageId,
        endpoint: sub.endpoint.slice(0, 48),
      });
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      console.warn('[push] failed', { status, endpoint: sub.endpoint.slice(0, 48) });
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      }
    }
  }));
}

export {
  ensureWebPush,
  isPushConfigured,
  sendMessagePush,
};
