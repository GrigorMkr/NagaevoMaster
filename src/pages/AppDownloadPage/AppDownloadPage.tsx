import { Navigate } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { Logo } from '@/components/ui/Logo/Logo';
import {
  MOBILE_APP_APK_SIZE_MB,
  MOBILE_APP_APK_URL,
  MOBILE_APP_APP_STORE_URL,
  MOBILE_APP_PLAY_STORE_URL,
  MOBILE_APP_RELEASE_NOTES,
  MOBILE_APP_RELEASED_AT,
  MOBILE_APP_VERSION,
  MOBILE_APP_VERSION_CODE,
} from '@/constants/mobileApp';
import { ROUTES } from '@/constants';
import { isAndroidDevice, isIosDevice } from '@/utils/pushEnvironment';
import { isNativeApp } from '@/utils/nativeApp';
import pageStyles from '@/styles/page.module.css';
import styles from './AppDownloadPage.module.css';

function formatReleaseDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

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
          <div className={styles.glow} aria-hidden />

          <header className={styles.hero}>
            <Logo variant="hero" className={styles.brand} />
            <p className={styles.tagline}>Объявления · переписка · форум · доска</p>
          </header>

          <section className={styles.versionCard} aria-label="Версия приложения">
            <div className={styles.versionRow}>
              <span className={styles.versionBadge}>v{MOBILE_APP_VERSION}</span>
              <span className={styles.buildCode}>сборка {MOBILE_APP_VERSION_CODE}</span>
            </div>
            <p className={styles.versionDate}>
              Обновлено:
              {' '}
              {formatReleaseDate(MOBILE_APP_RELEASED_AT)}
            </p>
            {MOBILE_APP_RELEASE_NOTES.length > 0 && (
              <ul className={styles.releaseNotes}>
                {MOBILE_APP_RELEASE_NOTES.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </section>

          <div className={styles.stores}>
            <a
              href={MOBILE_APP_APK_URL}
              download
              className={`${styles.storeBtn} ${onAndroid ? styles.storePrimary : ''}`}
            >
              <img
                className={styles.storeLogo}
                src="/images/download/android.png"
                alt=""
                width={120}
                height={48}
              />
              <span className={styles.storeText}>
                <strong>Скачать для Android</strong>
                <small>APK · ~{MOBILE_APP_APK_SIZE_MB} МБ</small>
              </span>
            </a>

            <a
              href={MOBILE_APP_APP_STORE_URL}
              className={`${styles.storeBtn} ${onIos ? styles.storePrimary : ''}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <img
                className={styles.storeLogo}
                src="/images/download/iphone.png"
                alt=""
                width={120}
                height={48}
              />
              <span className={styles.storeText}>
                <strong>Скачать для iPhone</strong>
                <small>App Store</small>
              </span>
            </a>
          </div>

          <p className={styles.note}>
            {onAndroid
              ? 'После скачивания откройте APK и разрешите установку из неизвестных источников.'
              : onIos
                ? 'Установите из App Store — уведомления работают в фоне.'
                : 'Откройте эту страницу с телефона или отсканируйте QR-код на сайте.'}
          </p>

          <p className={styles.playLink}>
            <a href={MOBILE_APP_PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
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
