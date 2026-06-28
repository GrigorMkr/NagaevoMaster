import webpush from 'web-push';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { extractFcmToken, isFcmEndpoint, isFcmConfigured, sendFcmMessage, sendFcmNotification, type MessagePushPayload } from './fcmPush.js';
import {
  extractRustoreToken,
  isRustoreEndpoint,
  isRustorePushConfigured,
  sendRustoreNotification,
} from './rustorePush.js';

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

function isWebPushConfigured(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

function isPushConfigured(): boolean {
  return Boolean(isWebPushConfigured() || isFcmConfigured() || isRustorePushConfigured());
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
    if (isRustoreEndpoint(sub.endpoint)) {
      const result = await sendRustoreNotification(extractRustoreToken(sub.endpoint), {
        title: payload.senderName,
        body: payload.preview,
        messageId: payload.messageId,
        data: {
          url: `/profile?section=messages&chat=${payload.conversationId}`,
          messageId: payload.messageId,
          senderName: payload.senderName,
        },
      });
      if (!result.ok && result.invalidToken) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      }
      return;
    }

    if (isFcmEndpoint(sub.endpoint)) {
      const result = await sendFcmMessage(extractFcmToken(sub.endpoint), payload);
      if (!result.ok && result.invalidToken) {
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

interface FriendPushPayload {
  recipientUserId: string;
  senderName: string;
  kind: 'friend_request' | 'friend_accepted';
}

async function sendFriendPush(payload: FriendPushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: payload.recipientUserId },
    orderBy: { updatedAt: 'desc' },
  });
  if (subscriptions.length === 0) return;

  const isRequest = payload.kind === 'friend_request';
  const body = {
    title: isRequest ? 'Заявка в друзья' : 'Друзья',
    body: isRequest
      ? `${payload.senderName} хочет добавить вас в друзья`
      : `${payload.senderName} принял(а) вашу заявку`,
    senderName: payload.senderName,
    url: '/profile?section=friends',
    tag: `friend-${payload.kind}-${Date.now()}`,
    icon: '/apple-touch-icon.png',
  };

  const pushPayload = JSON.stringify(body);

  await Promise.all(subscriptions.map(async (sub) => {
    if (isRustoreEndpoint(sub.endpoint)) {
      await sendRustoreNotification(extractRustoreToken(sub.endpoint), {
        title: body.title,
        body: body.body,
        data: { url: body.url },
      }).catch(() => undefined);
      return;
    }

    if (!ensureWebPush() && !isFcmEndpoint(sub.endpoint)) return;

    if (isFcmEndpoint(sub.endpoint)) {
      await sendFcmNotification(extractFcmToken(sub.endpoint), {
        title: body.title,
        body: body.body,
        data: { url: body.url },
      }).catch(() => undefined);
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
        { TTL: 60 * 60 * 24, urgency: 'high' },
      );
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      }
    }
  }));
}

interface GroupInvitePushPayload {
  recipientUserId: string;
  inviterName: string;
  groupName: string;
  conversationId: string;
}

async function sendGroupInvitePush(payload: GroupInvitePushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: payload.recipientUserId },
    orderBy: { updatedAt: 'desc' },
  });
  if (subscriptions.length === 0) return;

  const messageId = `group-invite-${payload.conversationId}-${payload.recipientUserId}-${Date.now()}`;
  const body = {
    title: 'Приглашение в сообщество',
    body: `${payload.inviterName} добавил(а) вас в «${payload.groupName}»`,
    senderName: payload.inviterName,
    messageId,
    url: `/profile?section=messages&chat=${payload.conversationId}`,
    tag: messageId,
    icon: '/apple-touch-icon.png',
    kind: 'group_invite',
  };

  const pushPayload = JSON.stringify(body);

  await Promise.all(subscriptions.map(async (sub) => {
    if (isRustoreEndpoint(sub.endpoint)) {
      await sendRustoreNotification(extractRustoreToken(sub.endpoint), {
        title: body.title,
        body: body.body,
        messageId,
        data: { url: body.url, messageId },
      }).catch(() => undefined);
      return;
    }

    if (isFcmEndpoint(sub.endpoint)) {
      await sendFcmNotification(extractFcmToken(sub.endpoint), {
        title: body.title,
        body: body.body,
        messageId,
        data: { url: body.url, messageId },
      }).catch(() => undefined);
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
        { TTL: 60 * 60 * 24, urgency: 'high', topic: messageId },
      );
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      }
    }
  }));
}

export {
  ensureWebPush,
  isPushConfigured,
  isWebPushConfigured,
  sendMessagePush,
  sendFriendPush,
  sendGroupInvitePush,
};
