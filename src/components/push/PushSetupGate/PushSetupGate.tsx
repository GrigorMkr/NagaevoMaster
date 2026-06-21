import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import { ROUTES } from '@/constants';
import {
  ensurePushNotifications,
  fetchPushStatus,
} from '@/services/pushApi';
import {
  isPushApiAvailable,
  needsIosPwaInstall,
} from '@/utils/pushEnvironment';
import { isPushEnabledPreference } from '@/utils/pushPreferences';
import styles from './PushSetupGate.module.css';

type GateMode = 'hidden' | 'ios-install' | 'denied' | 'loading';

function isNotificationDenied(): boolean {
  return Notification.permission === 'denied';
}

function PushSetupGate() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [mode, setMode] = useState<GateMode>('hidden');

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !isPushEnabledPreference()) {
      setMode('hidden');
      return;
    }

    if (!isPushApiAvailable()) {
      setMode('hidden');
      return;
    }

    if (needsIosPwaInstall()) {
      setMode('ios-install');
      return;
    }

    if (Notification.permission === 'denied') {
      setMode('denied');
      return;
    }

    setMode('loading');
    try {
      const status = await fetchPushStatus();
      if (!status.configured) {
        setMode('hidden');
        return;
      }

      if (Notification.permission === 'granted') {
        await ensurePushNotifications({ requestPermission: false });
        setMode('hidden');
        return;
      }

      await ensurePushNotifications({ requestPermission: true });
      setMode(isNotificationDenied() ? 'denied' : 'hidden');
    } catch {
      setMode('hidden');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

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
  }, [isAuthenticated, refresh]);

  if (!isAuthenticated || mode === 'hidden' || mode === 'loading') {
    return null;
  }

  if (mode === 'ios-install') {
    return (
      <section className={styles.gate} aria-label="Установка приложения">
        <p className={styles.badge}>iPhone</p>
        <p className={styles.text}>Установите приложение из App Store для уведомлений в фоне.</p>
        <div className={styles.actions}>
          <Link to={ROUTES.APP_DOWNLOAD} className={styles.primary}>
            Скачать
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.gate} ${styles.denied}`} aria-label="Уведомления отключены">
      <p className={styles.badge}>Система</p>
      <p className={styles.text}>Разрешите уведомления в настройках телефона.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => void refresh()}>
          Проверить
        </button>
      </div>
    </section>
  );
}

export {
  PushSetupGate,
};
