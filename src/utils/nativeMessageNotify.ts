import { Capacitor } from '@capacitor/core';
import { MessageNotify } from '@/plugins/messageNotify';
import { isNativeApp } from '@/utils/nativeApp';

async function showNativeMessageNotification(
  title: string,
  body: string,
  options?: { messageId?: string; url?: string },
): Promise<boolean> {
  if (!isNativeApp() || !Capacitor.isPluginAvailable('MessageNotify')) {
    return false;
  }

  try {
    await MessageNotify.show({
      title,
      body,
      messageId: options?.messageId,
      url: options?.url ?? '/profile?section=messages',
    });
    return true;
  } catch {
    return false;
  }
}

export {
  showNativeMessageNotification,
};
