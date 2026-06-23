import type { ConversationSummary } from '@/types/message';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { GroupAvatar } from '@/components/messages/GroupAvatar/GroupAvatar';
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
              const isGroup = item.type === 'group' && item.group;
              const label = isGroup ? item.group!.name : item.otherUser!.name;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => onSelect(item.id)}
                  >
                    {isGroup ? (
                      <GroupAvatar name={item.group!.name} avatarUrl={item.group!.avatarUrl} size="sm" />
                    ) : (
                      <UserAvatar
                        name={item.otherUser!.name}
                        src={resolveAuthorAvatar(
                          item.otherUser!.name,
                          item.otherUser!.login,
                          item.otherUser!.avatarUrl,
                        )}
                        size="sm"
                      />
                    )}
                    <span>
                      {label}
                      {isGroup && (
                        <small className={styles.groupHint}>
                          {' '}
                          ·
                          {' '}
                          {item.group!.memberCount}
                          {' '}
                          уч.
                        </small>
                      )}
                    </span>
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
