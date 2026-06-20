import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import { setForumNotifications } from '@/features/ui/uiSlice';
import { fetchNotifications } from '@/services/notificationsApi';
import { countUnreadNotifications } from '@/utils/notificationsStorage';

function NotificationsBootstrap() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setForumNotifications(false));
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const items = await fetchNotifications();
        if (cancelled) {
          return;
        }
        const unread = countUnreadNotifications(items.map((item) => item.id));
        dispatch(setForumNotifications(unread > 0));
      } catch {
        if (!cancelled) {
          dispatch(setForumNotifications(false));
        }
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [dispatch, isAuthenticated]);

  return null;
}

export {
  NotificationsBootstrap,
}
