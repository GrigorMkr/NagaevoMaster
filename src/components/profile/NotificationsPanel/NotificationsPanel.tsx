import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAppDispatch } from '@/app/hooks';
import { setForumNotifications } from '@/features/ui/uiSlice';
import { ProfileExpandableSection } from '@/components/profile/ProfileExpandableSection/ProfileExpandableSection';
import { Button } from '@/components/ui/Button/Button';
import { fetchNotifications } from '@/services/notificationsApi';
import type { NotificationItem } from '@/types/notification';
import {
  countUnreadNotifications,
  isNotificationUnread,
  markNotificationsRead,
} from '@/utils/notificationsStorage';
import styles from './NotificationsPanel.module.css';

function NotificationsPanel() {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setItems(data);
      dispatch(setForumNotifications(countUnreadNotifications(data.map((item) => item.id)) > 0));
    } catch {
      setItems([]);
      dispatch(setForumNotifications(false));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = countUnreadNotifications(items.map((item) => item.id));

  const handleMarkAllRead = () => {
    markNotificationsRead(items.map((item) => item.id));
    dispatch(setForumNotifications(false));
    setItems((current) => [...current]);
  };

  const handleItemClick = (id: string) => {
    markNotificationsRead([id]);
    dispatch(setForumNotifications(countUnreadNotifications(
      items.map((item) => item.id).filter((itemId) => itemId !== id && isNotificationUnread(itemId)),
    ) > 0));
  };

  return (
    <ProfileExpandableSection title="Уведомления" count={unreadCount || items.length} loading={loading}>
      {items.length === 0 ? (
        <p className={styles.empty}>Новых уведомлений нет</p>
      ) : (
        <>
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.link}
                  className={`${styles.item} ${isNotificationUnread(item.id) ? styles.itemUnread : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemMessage}>{item.message}</span>
                  <span className={styles.itemMeta}>
                    {format(new Date(item.createdAt), 'd MMM, HH:mm', { locale: ru })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Button type="button" size="sm" variant="outline" onClick={handleMarkAllRead}>
              Прочитать все
            </Button>
          </div>
        </>
      )}
    </ProfileExpandableSection>
  );
}

export {
  NotificationsPanel,
};
