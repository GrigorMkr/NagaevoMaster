import { registerPlugin } from '@capacitor/core';

export enum PushEvents {
  OnNewToken = 'ON_NEW_TOKEN',
  OnMessageReceived = 'ON_MESSAGE_RECEIVED',
  OnDeletedMessages = 'ON_DELETED_MESSAGES',
  OnError = 'ON_ERROR',
}

export interface PushAvailability {
  available: boolean;
  rustore?: boolean;
  firebase?: boolean;
  reason?: string;
}

export interface PushTokens {
  token: string;
  rustore?: string;
  firebase?: string;
}

export interface RemoteMessageNotification {
  title?: string;
  body?: string;
  channelId?: string;
  imageUrl?: string;
  color?: string;
  icon?: string;
  clickAction?: string;
  clickActionType?: string;
}

export interface RemoteMessage {
  messageId?: string;
  priority?: number;
  ttl?: number;
  from?: string;
  collapseKey?: string;
  data?: Record<string, string>;
  notification?: RemoteMessageNotification;
}

interface RuStorePushPlugin {
  checkPushAvailability(): Promise<PushAvailability>;
  getToken(): Promise<PushTokens>;
  deleteToken(): Promise<void>;
  subscribeToTopic(options: { topic: string }): Promise<void>;
  unsubscribeFromTopic(options: { topic: string }): Promise<void>;
  addListener(
    eventName: PushEvents,
    listener: (payload: unknown) => void,
  ): Promise<{ remove: () => void }>;
}

const RuStorePush = registerPlugin<RuStorePushPlugin>('RuStorePush');

export {
  RuStorePush,
};
