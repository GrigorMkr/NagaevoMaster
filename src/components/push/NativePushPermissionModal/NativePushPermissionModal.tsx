import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import {
  checkNativePushPermission,
  ensureNativePushNotifications,
  getLastNativePushRegistrationError,
  type NativePushPermission,
} from '@/services/nativePush';
import { hasNativeOAuthParams } from '@/services/completeOAuthLogin';
import { fetchPushStatus } from '@/services/pushApi';
import { onBootSplashDismissed } from '@/utils/bootSplash';
import { isNativeApp } from '@/utils/nativeApp';
import styles from '../PushPermissionModal/PushPermissionModal.module.css';

const DISMISS_KEY = 'nagaevo-native-push-prompt-dismissed';

function NativePushPermissionModal() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NativePushPermission>('prompt');

  const refresh = useCallback(async () => {
    if (!isNativeApp()) {
      setOpen(false);
      return;
    }

    if (hasNativeOAuthParams(`?${searchParams.toString()}`)) {
      setOpen(false);
      return;
    }

    const state = await checkNativePushPermission();
    if (!state) {
      setOpen(false);
      return;
    }

    setPermission(state);

    if (state === 'granted') {
      await ensureNativePushNotifications({ requestPermission: false, force: true });
      if (isAuthenticated) {
        const status = await fetchPushStatus().catch(() => null);
        setOpen(Boolean(status && !status.subscribed));
        return;
      }
      setOpen(false);
      return;
    }

    if (isAuthenticated) {
      const status = await fetchPushStatus().catch(() => null);
      if (status && !status.subscribed) {
        setOpen(true);
        return;
      }
    }

    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setOpen(false);
      return;
    }

    setOpen(true);
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    onBootSplashDismissed(() => {
      void refresh();
    });

    const fallbackTimer = window.setTimeout(() => {
      void refresh();
    }, 2500);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refresh();
  }, [isAuthenticated, refresh]);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    try {
      const ok = await ensureNativePushNotifications({ requestPermission: true, force: true });
      if (ok) {
        const status = await fetchPushStatus().catch(() => null);
        if (status && status.fcmConfigured === false) {
          toast.error('Сервер пока не отправляет push в приложение. Напишите в поддержку.');
          return;
        }
        toast.success('Уведомления включены — сообщения придут даже при закрытом приложении');
        setOpen(false);
        return;
      }

      const nextPermission = await checkNativePushPermission();
      if (nextPermission) {
        setPermission(nextPermission);
      }

      const registrationError = getLastNativePushRegistrationError();
      if (registrationError) {
        toast.error('Не удалось подключить уведомления. Переустановите приложение из RuStore.');
        return;
      }

      if (nextPermission === 'denied') {
        toast.error('Разрешите уведомления в настройках телефона');
        return;
      }

      toast.error('Разрешите уведомления в системном окне');
    } catch {
      toast.error('Не удалось включить уведомления');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  }, []);

  if (!open) return null;

  const denied = permission === 'denied';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="native-push-modal-title">
      <div className={styles.modal}>
        <p className={styles.badge}>Сообщения</p>
        <h2 id="native-push-modal-title" className={styles.title}>Уведомления о переписке</h2>
        <p className={styles.text}>
          {denied
            ? 'Уведомления отключены в настройках Android. Включите их для «Нагаево Мастер», чтобы получать сообщения со звуком.'
            : 'При новом сообщении придёт push со звуком — даже если приложение свёрнуто.'}
        </p>
        {!denied && (
          <ul className={styles.list}>
            <li>Кто написал и текст сообщения</li>
            <li>Работает в фоне после разрешения</li>
          </ul>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.primary} disabled={loading} onClick={() => void handleEnable()}>
            {loading ? 'Подключаем…' : denied ? 'Проверить снова' : 'Включить уведомления'}
          </button>
          {!denied && (
            <button type="button" className={styles.secondary} onClick={handleDismiss}>
              Позже
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export {
  NativePushPermissionModal,
};
