import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import styles from './RuStoreUpdateModal.module.css';

interface RuStoreUpdateModalProps {
  open: boolean;
  downloaded: boolean;
  downloading: boolean;
  progress: number | null;
  availableVersionCode: number | null;
  busy: boolean;
  onDownload: () => void;
  onInstall: () => void;
  onLater: () => void;
}

function RuStoreUpdateModal({
  open,
  downloaded,
  downloading,
  progress,
  availableVersionCode,
  busy,
  onDownload,
  onInstall,
  onLater,
}: RuStoreUpdateModalProps) {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onLater}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rustore-update-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="rustore-update-title" className={styles.title}>
          {downloaded ? 'Обновление готово' : 'Доступна новая версия'}
        </h2>
        <p className={styles.text}>
          {downloaded
            ? 'Новая версия уже скачана. Установите её, чтобы получить последние исправления и улучшения.'
            : availableVersionCode
              ? `В RuStore доступна версия ${availableVersionCode}. Рекомендуем обновить приложение.`
              : 'В RuStore доступна новая версия приложения. Рекомендуем обновить.'}
        </p>

        {downloading && (
          <div className={styles.progressWrap} aria-live="polite">
            <div className={styles.progressBar}>
              <span
                className={styles.progressFill}
                style={{ width: `${progress ?? 8}%` }}
              />
            </div>
            <p className={styles.progressLabel}>
              {progress != null ? `Скачивание: ${progress}%` : 'Скачивание…'}
            </p>
          </div>
        )}

        <div className={styles.actions}>
          {downloaded ? (
            <Button type="button" onClick={onInstall} loading={busy} fullWidth>
              Установить обновление
            </Button>
          ) : (
            <Button type="button" onClick={onDownload} loading={busy || downloading} fullWidth>
              Скачать обновление
            </Button>
          )}
          {!downloaded && (
            <Button type="button" variant="ghost" onClick={onLater} disabled={busy}>
              Позже
            </Button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

export {
  RuStoreUpdateModal,
};
