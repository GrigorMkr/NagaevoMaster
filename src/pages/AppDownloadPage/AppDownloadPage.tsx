import { Navigate } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { Logo } from '@/components/ui/Logo/Logo';
import {
  MOBILE_APP_RELEASE_NOTES,
  MOBILE_APP_RELEASED_AT,
  MOBILE_APP_RUSTORE_URL,
  MOBILE_APP_VERSION,
  MOBILE_APP_VERSION_CODE,
} from '@/constants/mobileApp';
import { ROUTES } from '@/constants';
import { useVkWidgets } from '@/constants/vkWidgets';
import { isNativeApp } from '@/utils/nativeApp';
import { VkVideoEmbed } from '@/components/vk';
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
  const vk = useVkWidgets();

  if (isNativeApp()) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <>
      <PageMeta
        title="Скачать приложение"
        description="Установите приложение Нагаево Мастер для Android из RuStore"
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

          {vk.video && (
            <section className={styles.videoSection} aria-label="Видео о приложении">
              <h2 className={styles.videoTitle}>Как пользоваться</h2>
              <VkVideoEmbed title="Нагаево Мастер — видео" />
            </section>
          )}

          <a
            href={MOBILE_APP_RUSTORE_URL}
            className={`${styles.storeBtn} ${styles.storeRustore} ${styles.storePrimary}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className={styles.storeRustoreMark} aria-hidden>Ru</span>
            <span className={styles.storeText}>
              <strong>Установить из RuStore</strong>
              <small>Android</small>
            </span>
          </a>
        </div>
      </div>
    </>
  );
}

export {
  AppDownloadPage,
};
