import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import {
  fetchPushStatus,
  isPushSupported,
  subscribeToPush,
} from '@/services/pushApi';
import { isNativeApp } from '@/utils/nativeApp';
import styles from './PushPermissionModal.module.css';

const DISMISS_KEY = 'nagaevo-push-prompt-dismissed';

function PushPermissionModal() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isPushSupported() || isNativeApp()) return;
    if (Notification.permission === 'denied') return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;

    void fetchPushStatus()
      .then((status) => {
        const needsPrompt = status.configured
          && !status.subscribed
          && Notification.permission !== 'denied';
        setOpen(needsPrompt);
      })
      .catch(() => setOpen(false));
  }, [isAuthenticated]);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    try {
      const ok = await subscribeToPush();
      if (ok) {
        toast.success('Уведомления включены — сообщения придут даже при закрытом сайте');
        setOpen(false);
      } else {
        toast.error('Разрешите уведомления в браузере');
      }
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

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="push-modal-title">
      <div className={styles.modal}>
        <p className={styles.badge}>Сообщения</p>
        <h2 id="push-modal-title" className={styles.title}>Уведомления о переписке</h2>
        <p className={styles.text}>
          Если свернуть или закрыть сайт, при новом сообщении придёт push со звуком:
          кто написал и текст.
        </p>
        <ul className={styles.list}>
          <li>Работает на телефоне и компьютере</li>
          <li>Добавьте сайт на главный экран — как приложение</li>
        </ul>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} disabled={loading} onClick={() => void handleEnable()}>
            {loading ? 'Подключаем…' : 'Включить уведомления'}
          </button>
          <button type="button" className={styles.secondary} onClick={handleDismiss}>
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}

export {
  PushPermissionModal,
};
