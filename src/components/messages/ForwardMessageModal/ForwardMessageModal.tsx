import type { ConversationSummary } from '@/types/message';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import styles from './ForwardMessageModal.module.css';

interface ForwardMessageModalProps {
  conversations: ConversationSummary[];
  excludeConversationId?: string;
  onSelect: (conversationId: string) => void;
  onClose: () => void;
}

function ForwardMessageModal({
  conversations,
  excludeConversationId,
  onSelect,
  onClose,
}: ForwardMessageModalProps) {
  const items = conversations.filter((item) => item.id !== excludeConversationId);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <h3>Переслать в чат</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        {items.length === 0 ? (
          <p className={styles.empty}>Нет других переписок</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => {
              const avatar = resolveAuthorAvatar(
                item.otherUser.name,
                item.otherUser.login,
                item.otherUser.avatarUrl,
              );
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => onSelect(item.id)}
                  >
                    <UserAvatar name={item.otherUser.name} src={avatar} size="sm" />
                    <span>{item.otherUser.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export {
  ForwardMessageModal,
};
