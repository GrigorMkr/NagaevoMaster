import { Navigate } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import {
  MOBILE_APP_APK_SIZE_MB,
  MOBILE_APP_APP_STORE_URL,
  MOBILE_APP_PLAY_STORE_URL,
  MOBILE_APP_VERSION,
} from '@/constants/mobileApp';
import { ROUTES } from '@/constants';
import { isAndroidDevice, isIosDevice } from '@/utils/pushEnvironment';
import { isNativeApp } from '@/utils/nativeApp';
import pageStyles from '@/styles/page.module.css';
import styles from './AppDownloadPage.module.css';

function AppDownloadPage() {
  if (isNativeApp()) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const onAndroid = isAndroidDevice();
  const onIos = isIosDevice();

  return (
    <>
      <PageMeta
        title="Скачать приложение"
        description="Скачайте приложение Нагаево Мастер для Android и iPhone"
        canonical="/app"
      />
      <div className={pageStyles.page}>
        <div className={styles.shell}>
          <div className={styles.hero}>
            <img src="/apple-touch-icon.png" alt="" className={styles.icon} />
            <h1 className={styles.title}>Нагаево Мастер</h1>
            <p className={styles.tagline}>Объявления · переписка · форум</p>
          </div>

          <div className={styles.stores}>
            <a
              href="/downloads/nagaevomaster.apk"
              className={`${styles.storeBtn} ${styles.storeAndroid} ${onAndroid ? styles.storePrimary : ''}`}
            >
              <span className={styles.storeIcon} aria-hidden>🤖</span>
              <span className={styles.storeText}>
                <strong>Android</strong>
                <small>Скачать APK · ~{MOBILE_APP_APK_SIZE_MB} МБ</small>
              </span>
            </a>

            <a
              href={MOBILE_APP_APP_STORE_URL}
              className={`${styles.storeBtn} ${styles.storeIos} ${onIos ? styles.storePrimary : ''}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className={styles.storeIcon} aria-hidden>🍎</span>
              <span className={styles.storeText}>
                <strong>iPhone</strong>
                <small>App Store</small>
              </span>
            </a>
          </div>

          <p className={styles.note}>
            {onAndroid
              ? 'После скачивания откройте APK и разрешите установку.'
              : onIos
                ? 'Установите из App Store — уведомления работают в фоне.'
                : 'Откройте эту страницу с телефона или отсканируйте QR на сайте.'}
          </p>

          <p className={styles.meta}>
            v{MOBILE_APP_VERSION}
            {' · '}
            <a href={MOBILE_APP_PLAY_STORE_URL} className={styles.link} target="_blank" rel="noopener noreferrer">
              Google Play
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export {
  AppDownloadPage,
};
