import { playMessageSound } from '@/utils/messageSound';
import { isNativeApp } from '@/utils/nativeApp';
import { showNativeMessageNotification } from '@/utils/nativeMessageNotify';

function buildNotificationTag(messageId?: string): string {
  return messageId ? `message-${messageId}` : 'nagaevo-message';
}

async function showMessageNotification(
  senderName: string,
  preview: string,
  options?: { url?: string; messageId?: string },
): Promise<void> {
  const tag = buildNotificationTag(options?.messageId);
  const url = options?.url ?? '/profile?section=messages';

  if (isNativeApp()) {
    const shown = await showNativeMessageNotification(senderName, preview, {
      messageId: options?.messageId,
      url,
    });
    if (!shown) {
      void playMessageSound();
    }
    return;
  }

  if (typeof window === 'undefined' || Notification.permission !== 'granted') {
    void playMessageSound();
    return;
  }

  const notificationOptions = {
    body: preview,
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32.png',
    tag,
    renotify: true,
    silent: true,
    data: { url: options?.url ?? '/profile?section=messages' },
  } as NotificationOptions;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(senderName, notificationOptions);
    } else {
      new Notification(senderName, notificationOptions);
    }
  } catch {
    try {
      new Notification(senderName, notificationOptions);
    } catch {
      // звук только через message.mp3
    }
  }

  void playMessageSound();
}

export {
  showMessageNotification,
  buildNotificationTag,
};
