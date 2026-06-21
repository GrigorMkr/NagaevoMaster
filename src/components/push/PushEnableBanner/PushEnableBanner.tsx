import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchPushStatus,
  isPushSupported,
  subscribeToPush,
  syncPushSubscription,
} from '@/services/pushApi';
import { getAuthToken } from '@/services/authApi';
import styles from './PushEnableBanner.module.css';

interface PushEnableBannerProps {
  compact?: boolean;
}

function PushEnableBanner({ compact = false }: PushEnableBannerProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isPushSupported() || !getAuthToken()) {
      setVisible(false);
      return;
    }

    try {
      const status = await fetchPushStatus();
      if (!status.configured || Notification.permission === 'denied') {
        setVisible(false);
        return;
      }

      if (Notification.permission === 'granted') {
        const synced = await syncPushSubscription().catch(() => false);
        setVisible(!synced && !status.subscribed);
        return;
      }

      setVisible(!status.subscribed);
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    try {
      const ok = await subscribeToPush();
      if (ok) {
        toast.success('Уведомления включены — сообщения придут со звуком');
        setVisible(false);
      } else {
        toast.error('Разрешите уведомления в настройках браузера');
        await refresh();
      }
    } catch {
      toast.error('Разрешите уведомления в настройках браузера');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  if (!visible) return null;

  return (
    <div className={compact ? styles.bannerCompact : styles.banner}>
      <div className={styles.copy}>
        <strong>🔔 Уведомления со звуком</strong>
        <p>Кто написал и текст — даже если сайт свёрнут</p>
      </div>
      <button type="button" className={styles.button} disabled={loading} onClick={() => void handleEnable()}>
        {loading ? '…' : 'Включить'}
      </button>
    </div>
  );
}

export {
  PushEnableBanner,
};
