import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { buildNativeOAuthReturnUrls } from '@/utils/nativeOAuthReturn';
import { isNativeApp } from '@/utils/nativeApp';
import { useNativeOAuthCompletion } from '@/hooks/useNativeOAuthCompletion';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import styles from './NativeOAuthReturnPage.module.css';

function isAndroidBrowser() {
  return /Android/i.test(navigator.userAgent);
}

function NativeOAuthReturnPage() {
  const [manualRequired, setManualRequired] = useState(false);
  const [searchParams] = useSearchParams();
  const autoOpenAttemptedRef = useRef(false);
  const returnUrls = useMemo(
    () => buildNativeOAuthReturnUrls(searchParams.toString()),
    [searchParams],
  );

  useNativeOAuthCompletion();

  const openApp = () => {
    window.location.href = returnUrls.customScheme;
    if (isAndroidBrowser()) {
      window.setTimeout(() => {
        window.location.href = returnUrls.intentUrl;
      }, 300);
    }
    window.setTimeout(() => {
      try {
        window.close();
      } catch {
        // ignore
      }
    }, 1200);
  };

  useEffect(() => {
    if (isNativeApp()) return undefined;
    if (autoOpenAttemptedRef.current) return undefined;
    autoOpenAttemptedRef.current = true;

    if (searchParams.get('oauth_error')) {
      setManualRequired(true);
      return undefined;
    }

    openApp();
    const fallbackTimer = window.setTimeout(() => {
      setManualRequired(true);
    }, 2200);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [returnUrls, searchParams]);

  return (
    <>
      <PageMeta title="Возврат в приложение" canonical="/auth/app-return" />
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Вход выполнен</h1>
          <p className={styles.lead}>
            {manualRequired
              ? 'Нажмите кнопку, чтобы вернуться в приложение «Нагаево Мастер».'
              : 'Открываем приложение…'}
          </p>
          <button type="button" className={styles.button} onClick={openApp}>
            Открыть приложение
          </button>
          <a href={returnUrls.appLink} className={styles.linkButton}>
            Открыть через ссылку приложения
          </a>
          <p className={styles.hint}>
            Остались в браузере?{' '}
            <Link to={ROUTES.AUTH} className={styles.link}>
              Вернуться ко входу
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export {
  NativeOAuthReturnPage,
};
