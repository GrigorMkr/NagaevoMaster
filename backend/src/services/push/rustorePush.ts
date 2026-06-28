import { env } from '../../config/env.js';

const RUSTORE_ENDPOINT_PREFIX = 'rustore:';
const RUSTORE_PUSH_API_URL = 'https://vkpns-universal.rustore.ru/v1/send';

function isRustoreEndpoint(endpoint: string): boolean {
  return endpoint.startsWith(RUSTORE_ENDPOINT_PREFIX);
}

function extractRustoreToken(endpoint: string): string {
  return endpoint.slice(RUSTORE_ENDPOINT_PREFIX.length);
}

function isRustorePushConfigured(): boolean {
  return Boolean(env.RUSTORE_PUSH_PROJECT_ID && env.RUSTORE_PUSH_SERVICE_TOKEN);
}

interface RustoreNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  messageId?: string;
}

interface RustoreSendResult {
  ok: boolean;
  invalidToken: boolean;
}

async function sendRustoreNotification(
  token: string,
  payload: RustoreNotificationPayload,
): Promise<RustoreSendResult> {
  const projectId = env.RUSTORE_PUSH_PROJECT_ID;
  const serviceToken = env.RUSTORE_PUSH_SERVICE_TOKEN;
  if (!projectId || !serviceToken) {
    return { ok: false, invalidToken: false };
  }

  const response = await fetch(RUSTORE_PUSH_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      providers: {
        rustore: {
          auth_token: serviceToken,
          project_id: projectId,
        },
      },
      tokens: {
        rustore: [token],
      },
      message: {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          notification: {
            title: payload.title,
            body: payload.body,
            channel_id: 'nagaevo_messages',
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const invalidToken = response.status === 404
      || /NOT_FOUND|UNREGISTERED|invalid.*token/i.test(text);
    console.warn('[rustore-push] failed', response.status, text.slice(0, 160));
    return { ok: false, invalidToken };
  }

  return { ok: true, invalidToken: false };
}

export {
  RUSTORE_ENDPOINT_PREFIX,
  extractRustoreToken,
  isRustoreEndpoint,
  isRustorePushConfigured,
  sendRustoreNotification,
};

export type {
  RustoreNotificationPayload,
  RustoreSendResult,
};
