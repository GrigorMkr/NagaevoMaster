import toast from 'react-hot-toast';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { buildAvatarUrl } from '@/utils/avatarUrl';
import styles from './messageLightningToast.module.css';

interface MessageLightningOptions {
  senderName: string;
  preview: string;
  avatarUrl?: string;
  conversationId?: string;
}

function openChat(conversationId?: string) {
  if (!conversationId) return;
  window.location.href = `/profile?section=messages&chat=${conversationId}`;
}

function showMessageLightning(options: MessageLightningOptions) {
  const { senderName, preview, avatarUrl, conversationId } = options;
  const avatarSrc = avatarUrl || buildAvatarUrl(senderName, senderName);

  toast.custom(
    (t) => (
      <button
        type="button"
        className={`${styles.root} ${t.visible ? styles.visible : styles.hidden}`}
        onClick={() => {
          toast.dismiss(t.id);
          openChat(conversationId);
        }}
        aria-label={`Новое сообщение от ${senderName}`}
      >
        <span className={styles.avatarWrap}>
          <UserAvatar name={senderName} src={avatarSrc} size="sm" />
          <span className={styles.dot} aria-hidden />
        </span>
        <div className={styles.body}>
          <strong className={styles.title}>{senderName}</strong>
          <p className={styles.preview}>{preview}</p>
          {conversationId && <span className={styles.cta}>Открыть чат →</span>}
        </div>
      </button>
    ),
    {
      id: conversationId ? `message-${conversationId}` : 'message-lightning',
      duration: 4200,
      position: 'top-center',
    },
  );
}

export {
  showMessageLightning,
};

export type {
  MessageLightningOptions,
};
