import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [searchParams] = useSearchParams();
  const hasOAuthError = Boolean(searchParams.get('oauth_error'));
  const [autoOpenFailed, setAutoOpenFailed] = useState(hasOAuthError);
  const autoOpenAttemptedRef = useRef(false);
  const returnUrls = useMemo(
    () => buildNativeOAuthReturnUrls(searchParams.toString()),
    [searchParams],
  );

  useNativeOAuthCompletion();

  const openApp = useCallback(() => {
    if (navigator.userAgent.includes('NagaevoMasterApp')) {
      return;
    }
    window.location.replace(returnUrls.customScheme);
    if (isAndroidBrowser()) {
      window.setTimeout(() => {
        window.location.replace(returnUrls.intentUrl);
      }, 300);
    }
    window.setTimeout(() => {
      try {
        window.close();
      } catch {
        // ignore
      }
    }, 1200);
  }, [returnUrls]);

  useEffect(() => {
    if (isNativeApp() || hasOAuthError || autoOpenAttemptedRef.current) return undefined;
    if (navigator.userAgent.includes('NagaevoMasterApp')) return undefined;
    autoOpenAttemptedRef.current = true;

    openApp();
    const fallbackTimer = window.setTimeout(() => {
      setAutoOpenFailed(true);
    }, 2200);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [hasOAuthError, openApp]);

  const manualRequired = autoOpenFailed;

  return (
    <>
      <PageMeta title="Возврат в приложение" canonical="/auth/app-return" robots="noindex, nofollow" />
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
