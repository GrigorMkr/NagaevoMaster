import { useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import styles from './FriendActionMenu.module.css';

export type FriendMenuAction =
  | 'message'
  | 'accept'
  | 'remove'
  | 'block'
  | 'profile';

interface FriendActionMenuProps {
  open: boolean;
  userName: string;
  actions: Array<{
    id: FriendMenuAction;
    label: string;
    tone?: 'default' | 'danger';
    disabled?: boolean;
  }>;
  onSelect: (action: FriendMenuAction) => void;
  onClose: () => void;
}

function FriendActionMenu({
  open,
  userName,
  actions,
  onSelect,
  onClose,
}: FriendActionMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
    };
  }, [onClose, open]);

  const handleSelect = useCallback((action: FriendMenuAction) => {
    onSelect(action);
    onClose();
  }, [onClose, onSelect]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="menu"
        aria-label={`Действия: ${userName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className={styles.title}>{userName}</p>
        <ul className={styles.list}>
          {actions.map((action) => (
            <li key={action.id}>
              <button
                type="button"
                role="menuitem"
                className={classNames(
                  styles.item,
                  action.tone === 'danger' && styles.itemDanger,
                )}
                disabled={action.disabled}
                onClick={() => handleSelect(action.id)}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  );
}

export {
  FriendActionMenu,
};
