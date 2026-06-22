import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Listing } from '@/types/listing';
import type { FriendUser } from '@/types/friend';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser } from '@/features/user/userSelectors';
import { fetchFriendsOverview } from '@/services/friendsApi';
import { repostListing } from '@/services/listingSocialApi';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { Button } from '@/components/ui/Button/Button';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { getErrorMessage } from '@/utils/errorMessage';
import toast from 'react-hot-toast';
import styles from './RepostListingModal.module.css';

interface RepostListingModalProps {
  listing: Listing;
  onClose: () => void;
  onDone: (repostsCount: number) => void;
}

function RepostListingModal({ listing, onClose, onDone }: RepostListingModalProps) {
  const currentUser = useAppSelector(selectCurrentUser);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    void fetchFriendsOverview()
      .then((overview) => {
        if (cancelled) return;
        setFriends(overview.friends.map((item) => item.user));
      })
      .catch(() => {
        if (!cancelled) setFriends([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const toggle = (userId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.error('Выберите получателя');
      return;
    }
    setSubmitting(true);
    try {
      const result = await repostListing(listing.id, [...selected]);
      onDone(result.repostsCount);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить репост'));
    } finally {
      setSubmitting(false);
    }
  };

  const selfAvatar = currentUser
    ? resolveAuthorAvatar(currentUser.name, currentUser.email.split('@')[0] ?? '', currentUser.avatarUrl)
    : undefined;

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <h3>Репост в личку</h3>
            <p className={styles.subtitle}>{listing.title}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <ul className={styles.list}>
          {currentUser && (
            <li>
              <label className={styles.item}>
                <input
                  type="checkbox"
                  checked={selected.has(currentUser.id)}
                  onChange={() => toggle(currentUser.id)}
                />
                <UserAvatar name="Себе" src={selfAvatar} size="sm" />
                <span>
                  <strong>Себе</strong>
                  <small>сохранить в личные сообщения</small>
                </span>
              </label>
            </li>
          )}

          {loading && <li className={styles.hint}>Загрузка друзей…</li>}

          {!loading && friends.length === 0 && (
            <li className={styles.hint}>Друзей пока нет — можно отправить себе</li>
          )}

          {friends.map((friend) => {
            const avatar = resolveAuthorAvatar(friend.name, friend.login, friend.avatarUrl);
            return (
              <li key={friend.id}>
                <label className={styles.item}>
                  <input
                    type="checkbox"
                    checked={selected.has(friend.id)}
                    onChange={() => toggle(friend.id)}
                  />
                  <UserAvatar name={friend.name} src={avatar} size="sm" />
                  <span>
                    <strong>{friend.name}</strong>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <footer className={styles.footer}>
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="button" disabled={submitting || selected.size === 0} onClick={() => void handleSubmit()}>
            {submitting ? 'Отправка…' : 'Отправить'}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export {
  RepostListingModal,
};
