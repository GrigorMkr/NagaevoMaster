import { useEffect, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import { isStandalonePwa, needsIosPwaInstall } from '@/utils/pushEnvironment';
import styles from './IosSafariPushBanner.module.css';

const DISMISS_KEY = 'nagaevo:ios-push-banner-dismissed';

function IosSafariPushBanner() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !needsIosPwaInstall()) {
      setVisible(false);
      return;
    }

    try {
      setVisible(localStorage.getItem(DISMISS_KEY) !== '1');
    } catch {
      setVisible(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isStandalonePwa()) {
      setVisible(false);
    }
  }, []);

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        <strong>iPhone:</strong> добавьте сайт на главный экран — так уведомления работают в фоне.
      </p>
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Скрыть">
        ×
      </button>
    </div>
  );
}

export {
  IosSafariPushBanner,
};
