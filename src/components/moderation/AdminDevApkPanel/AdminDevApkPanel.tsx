import { useEffect, useMemo, useState } from 'react';
import { SITE_URL } from '@/constants/app';
import {
  MOBILE_APP_APK_SIZE_MB,
  MOBILE_APP_APK_URL,
  MOBILE_APP_RELEASE_NOTES,
  MOBILE_APP_RELEASED_AT,
  MOBILE_APP_RUSTORE_URL,
  MOBILE_APP_VERSION,
  MOBILE_APP_VERSION_CODE,
  resolveMobileApkDownloadUrl,
  resolveMobileApkFileName,
} from '@/constants/mobileApp';
import styles from './AdminDevApkPanel.module.css';

interface AppVersionPayload {
  version: string;
  versionCode: number;
  releasedAt: string;
  apkSizeMb: number;
  apkFileName?: string;
  releaseNotes: string[];
  rustoreUrl?: string;
}

const FALLBACK_VERSION: AppVersionPayload = {
  version: MOBILE_APP_VERSION,
  versionCode: MOBILE_APP_VERSION_CODE,
  releasedAt: MOBILE_APP_RELEASED_AT,
  apkSizeMb: MOBILE_APP_APK_SIZE_MB,
  releaseNotes: MOBILE_APP_RELEASE_NOTES,
  rustoreUrl: MOBILE_APP_RUSTORE_URL,
};

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

function AdminDevApkPanel() {
  const [versionInfo, setVersionInfo] = useState<AppVersionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}app-version.json`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('app-version.json not found');
        }
        const payload = await response.json() as AppVersionPayload;
        if (!cancelled) {
          setVersionInfo(payload);
        }
      } catch {
        if (!cancelled) {
          setVersionInfo(FALLBACK_VERSION);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const info = versionInfo ?? FALLBACK_VERSION;
  const apkFileName = useMemo(
    () => resolveMobileApkFileName(info.version, info.apkFileName),
    [info.apkFileName, info.version],
  );
  const apkDownloadUrl = useMemo(
    () => resolveMobileApkDownloadUrl(info.version, info.apkFileName),
    [info.apkFileName, info.version],
  );

  return (
    <section className={styles.panel} aria-label="Сборка Android">
      <p className={styles.intro}>
        Прямая установка APK для тестирования и разработки. Метаданные и файл
        обновляются при сборке
        {' '}
        <code>npm run build:rustore</code>
        {' '}
        и деплое на хостинг.
      </p>

      {loading ? (
        <p className={styles.status}>Загрузка информации о сборке…</p>
      ) : (
        <article className={styles.card}>
          <h3 className={styles.title}>Android APK</h3>

          <div className={styles.meta}>
            <span className={styles.versionBadge}>
              v
              {info.version}
            </span>
            <p className={styles.metaText}>
              Сборка
              {' '}
              {info.versionCode}
              {' · '}
              ~
              {info.apkSizeMb}
              {' '}
              МБ
            </p>
          </div>

          <p className={styles.metaText}>
            Обновлено:
            {' '}
            {formatReleaseDate(info.releasedAt)}
          </p>

          {info.releaseNotes.length > 0 && (
            <ul className={styles.notes}>
              {info.releaseNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

          <div className={styles.actions}>
            <a
              className={styles.downloadBtn}
              href={apkDownloadUrl}
              download={apkFileName}
            >
              Скачать APK
            </a>
            <a
              className={styles.secondaryLink}
              href={MOBILE_APP_APK_URL}
              download="nagaevomaster.apk"
            >
              Последняя сборка
            </a>
            {info.rustoreUrl && (
              <a
                className={styles.secondaryLink}
                href={info.rustoreUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                RuStore
              </a>
            )}
          </div>

          <p className={styles.fileName}>
            Файл:
            {' '}
            {apkFileName}
            {' · '}
            {SITE_URL}
            /downloads/
            {apkFileName}
          </p>
        </article>
      )}
    </section>
  );
}

export {
  AdminDevApkPanel,
};
