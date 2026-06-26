import { registerPlugin } from '@capacitor/core';

interface MessageNotifyPlugin {
  show(options: {
    title: string;
    body: string;
    messageId?: string;
    url?: string;
  }): Promise<void>;
}

const MessageNotify = registerPlugin<MessageNotifyPlugin>('MessageNotify');

export {
  MessageNotify,
};
