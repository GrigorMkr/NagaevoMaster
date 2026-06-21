import { env } from '../../config/env.js';

const FCM_ENDPOINT_PREFIX = 'fcm:';

function isFcmEndpoint(endpoint: string): boolean {
  return endpoint.startsWith(FCM_ENDPOINT_PREFIX);
}

function extractFcmToken(endpoint: string): string {
  return endpoint.slice(FCM_ENDPOINT_PREFIX.length);
}

interface MessagePushPayload {
  recipientUserId: string;
  senderName: string;
  preview: string;
  conversationId: string;
  messageId: string;
}

async function sendFcmMessage(token: string, payload: MessagePushPayload): Promise<boolean> {
  const serverKey = env.FCM_SERVER_KEY;
  if (!serverKey) return false;

  const body = {
    to: token,
    priority: 'high',
    notification: {
      title: payload.senderName,
      body: payload.preview,
      sound: 'default',
      icon: 'notification_icon',
    },
    data: {
      url: `/profile?section=messages&chat=${payload.conversationId}`,
      messageId: payload.messageId,
      senderName: payload.senderName,
    },
  };

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${serverKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.warn('[fcm] failed', response.status, text.slice(0, 120));
    return false;
  }

  const result = await response.json().catch(() => null) as { failure?: number; results?: { error?: string }[] } | null;
  const error = result?.results?.[0]?.error;
  if (result?.failure || error) {
    console.warn('[fcm] token error', error);
    return false;
  }

  console.info('[fcm] sent', {
    userId: payload.recipientUserId,
    messageId: payload.messageId,
    token: token.slice(0, 12),
  });
  return true;
}

export {
  FCM_ENDPOINT_PREFIX,
  isFcmEndpoint,
  extractFcmToken,
  sendFcmMessage,
};

export type {
  MessagePushPayload,
};
