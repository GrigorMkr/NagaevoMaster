import { existsSync } from 'node:fs';
import { GoogleAuth } from 'google-auth-library';
import { env } from '../../config/env.js';

const FCM_ENDPOINT_PREFIX = 'fcm:';
/** Канал уведомлений Android — совпадает с MainActivity.PUSH_CHANNEL_ID */
const ANDROID_PUSH_CHANNEL_ID = 'nagaevo_messages';

let fcmAuth: GoogleAuth | null = null;

function isInvalidFcmTokenError(status: number, text: string): boolean {
  if (status === 404) return true;
  return /NOT_FOUND|UNREGISTERED|registration-token-not-registered|InvalidRegistration|NotRegistered/i.test(text);
}

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

interface FcmSendResult {
  ok: boolean;
  invalidToken: boolean;
}

async function sendFcmLegacy(token: string, payload: FcmNotificationPayload): Promise<FcmSendResult> {
  const serverKey = env.FCM_SERVER_KEY;
  if (!serverKey) {
    console.warn('[fcm] legacy skipped: FCM_SERVER_KEY not set');
    return { ok: false, invalidToken: false };
  }

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
        sound: 'nagaevo_message',
        icon: 'notification_icon',
      },
      data: payload.data ?? {},
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.warn('[fcm] failed', response.status, text.slice(0, 120));
    return { ok: false, invalidToken: isInvalidFcmTokenError(response.status, text) };
  }

  const result = await response.json().catch(() => null) as { failure?: number; results?: { error?: string }[] } | null;
  const error = result?.results?.[0]?.error;
  if (result?.failure || error) {
    console.warn('[fcm] token error', error);
    return { ok: false, invalidToken: isInvalidFcmTokenError(0, error ?? '') };
  }

  return { ok: true, invalidToken: false };
}

async function sendFcmV1(token: string, payload: FcmNotificationPayload): Promise<FcmSendResult> {
  const auth = getFcmAuth();
  const projectId = env.FCM_PROJECT_ID;
  if (!auth || !projectId) {
    console.warn('[fcm] v1 skipped: FCM_PROJECT_ID or service account missing');
    return { ok: false, invalidToken: false };
  }

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken = accessTokenResponse.token;
  if (!accessToken) {
    return { ok: false, invalidToken: false };
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
            sound: 'nagaevo_message',
            channelId: ANDROID_PUSH_CHANNEL_ID,
            notificationPriority: 'PRIORITY_HIGH',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.warn('[fcm] v1 failed', response.status, text.slice(0, 160));
    return { ok: false, invalidToken: isInvalidFcmTokenError(response.status, text) };
  }

  return { ok: true, invalidToken: false };
}

async function sendFcmNotification(token: string, payload: FcmNotificationPayload): Promise<FcmSendResult> {
  if (resolveServiceAccountPath() && env.FCM_PROJECT_ID) {
    const v1 = await sendFcmV1(token, payload);
    if (v1.ok) {
      return v1;
    }
    if (v1.invalidToken) {
      return v1;
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

interface FcmMessageSendResult {
  ok: boolean;
  invalidToken: boolean;
}

async function sendFcmMessage(token: string, payload: MessagePushPayload): Promise<FcmMessageSendResult> {
  const result = await sendFcmNotification(token, {
    title: payload.senderName,
    body: payload.preview,
    messageId: payload.messageId,
    data: {
      url: `/profile?section=messages&chat=${payload.conversationId}`,
      messageId: payload.messageId,
      senderName: payload.senderName,
    },
  });

  if (result.ok) {
    console.info('[fcm] sent', {
      userId: payload.recipientUserId,
      messageId: payload.messageId,
      token: token.slice(0, 12),
    });
  }

  return result;
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
