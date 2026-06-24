import { existsSync } from 'node:fs';
import { GoogleAuth } from 'google-auth-library';
import { env } from '../../config/env.js';

const FCM_ENDPOINT_PREFIX = 'fcm:';

let fcmAuth: GoogleAuth | null = null;

interface FcmNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  messageId?: string;
}

function isFcmEndpoint(endpoint: string): boolean {
  return endpoint.startsWith(FCM_ENDPOINT_PREFIX);
}

function extractFcmToken(endpoint: string): string {
  return endpoint.slice(FCM_ENDPOINT_PREFIX.length);
}

function resolveServiceAccountPath(): string | null {
  const candidates = [
    env.FCM_SERVICE_ACCOUNT_PATH,
    env.GOOGLE_APPLICATION_CREDENTIALS,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getFcmAuth(): GoogleAuth | null {
  const keyFile = resolveServiceAccountPath();
  if (!keyFile) {
    return null;
  }

  if (!fcmAuth) {
    fcmAuth = new GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
  }

  return fcmAuth;
}

function isFcmConfigured(): boolean {
  return Boolean(env.FCM_SERVER_KEY || (env.FCM_PROJECT_ID && resolveServiceAccountPath()));
}

async function sendFcmLegacy(token: string, payload: FcmNotificationPayload): Promise<boolean> {
  const serverKey = env.FCM_SERVER_KEY;
  if (!serverKey) return false;

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${serverKey}`,
    },
    body: JSON.stringify({
      to: token,
      priority: 'high',
      notification: {
        title: payload.title,
        body: payload.body,
        sound: 'default',
        icon: 'notification_icon',
      },
      data: payload.data ?? {},
    }),
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

  return true;
}

async function sendFcmV1(token: string, payload: FcmNotificationPayload): Promise<boolean> {
  const auth = getFcmAuth();
  const projectId = env.FCM_PROJECT_ID;
  if (!auth || !projectId) {
    return false;
  }

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken = accessTokenResponse.token;
  if (!accessToken) {
    return false;
  }

  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: 'HIGH',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.warn('[fcm] v1 failed', response.status, text.slice(0, 160));
    return false;
  }

  return true;
}

async function sendFcmNotification(token: string, payload: FcmNotificationPayload): Promise<boolean> {
  if (resolveServiceAccountPath() && env.FCM_PROJECT_ID) {
    const ok = await sendFcmV1(token, payload);
    if (ok) {
      return true;
    }
  }

  return sendFcmLegacy(token, payload);
}

interface MessagePushPayload {
  recipientUserId: string;
  senderName: string;
  preview: string;
  conversationId: string;
  messageId: string;
}

async function sendFcmMessage(token: string, payload: MessagePushPayload): Promise<boolean> {
  const ok = await sendFcmNotification(token, {
    title: payload.senderName,
    body: payload.preview,
    messageId: payload.messageId,
    data: {
      url: `/profile?section=messages&chat=${payload.conversationId}`,
      messageId: payload.messageId,
      senderName: payload.senderName,
    },
  });

  if (ok) {
    console.info('[fcm] sent', {
      userId: payload.recipientUserId,
      messageId: payload.messageId,
      token: token.slice(0, 12),
    });
  }

  return ok;
}

export {
  FCM_ENDPOINT_PREFIX,
  isFcmEndpoint,
  extractFcmToken,
  isFcmConfigured,
  sendFcmMessage,
  sendFcmNotification,
};

export type {
  MessagePushPayload,
  FcmNotificationPayload,
};
