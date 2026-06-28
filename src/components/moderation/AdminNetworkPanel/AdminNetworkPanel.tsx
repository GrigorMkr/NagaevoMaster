import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  fetchAdminNetworkUsers,
  type AdminNetworkUserItem,
} from '@/services/moderationApi';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { buildAvatarUrl } from '@/utils/avatarUrl';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './AdminNetworkPanel.module.css';

interface AdminNetworkPanelProps {
  open: boolean;
  onClose: () => void;
  onMessageUser: (userId: string) => void;
}

function NetworkUserRow({
  user,
  onMessageUser,
}: {
  user: AdminNetworkUserItem;
  onMessageUser: (userId: string) => void;
}) {
  return (
    <li className={styles.row}>
      <UserAvatar
        name={user.name}
        src={buildAvatarUrl(user.name, user.email)}
        size="sm"
      />
      <div className={styles.meta}>
        <p className={styles.name}>
          {user.name}
          {user.isOnline && <span className={styles.onlineBadge}>в сети</span>}
          {user.welcomeSent && <span className={styles.welcomeBadge}>приветствие отправлено</span>}
        </p>
        <p className={styles.subline}>
          @
          {user.login}
          {' · '}
          {user.email}
        </p>
        <p className={styles.subline}>
          Регистрация:
          {' '}
          {format(new Date(user.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
        </p>
      </div>
      <button
        type="button"
        className={styles.messageBtn}
        onClick={() => onMessageUser(user.id)}
      >
        Написать
      </button>
    </li>
  );
}

function AdminNetworkPanel({ open, onClose, onMessageUser }: AdminNetworkPanelProps) {
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState<AdminNetworkUserItem[]>([]);
  const [newUsers, setNewUsers] = useState<AdminNetworkUserItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminNetworkUsers();
      setOnline(data.online);
      setNewUsers(data.newUsers);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить пользователей'));
      setOnline([]);
      setNewUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const handleMessageUser = (userId: string) => {
    onMessageUser(userId);
    onClose();
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Пользователи в сети"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h3 className={styles.title}>Пользователи</h3>
            <p className={styles.subtitle}>В сети и новые регистрации</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        {loading && online.length === 0 && newUsers.length === 0 ? (
          <p className={styles.status}>Загрузка…</p>
        ) : (
          <div className={styles.content}>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>
                В сети сейчас
                {' '}
                <span className={styles.count}>{online.length}</span>
              </h4>
              {online.length === 0 ? (
                <p className={styles.empty}>Сейчас никого нет в сети</p>
              ) : (
                <ul className={styles.list}>
                  {online.map((user) => (
                    <NetworkUserRow key={user.id} user={user} onMessageUser={handleMessageUser} />
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>
                Новые сегодня
                {' '}
                <span className={styles.count}>{newUsers.length}</span>
              </h4>
              {newUsers.length === 0 ? (
                <p className={styles.empty}>Сегодня новых регистраций пока нет</p>
              ) : (
                <ul className={styles.list}>
                  {newUsers.map((user) => (
                    <NetworkUserRow key={user.id} user={user} onMessageUser={handleMessageUser} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

export {
  AdminNetworkPanel,
};
