import { memo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { GEO } from '@/constants';
import { peekPendingSearchQuery } from '@/constants/user-location';
import styles from './LocationPromptDialog.module.css';

interface LocationPromptDialogProps {
  open: boolean;
  loading?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const LocationPromptDialog = memo(function LocationPromptDialog({
  open,
  loading,
  onAccept,
  onDecline,
}: LocationPromptDialogProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onDecline();
    }
  }, [onDecline]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  const pendingQuery = peekPendingSearchQuery();

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-prompt-title"
      >
        <h2 id="location-prompt-title" className={styles.title}>
          Определить ваше местоположение?
        </h2>
        <p className={styles.text}>
          Разрешите доступ к геолокации — мы покажем вас на карте и подберём ближайшие услуги
          {pendingQuery ? ` по запросу «${pendingQuery}»` : ''} в радиусе {GEO.radiusKm} км от Нагаево.
        </p>
        <p className={styles.hint}>
          Координаты сохраняются только в вашем браузере и используются для сортировки по расстоянию.
        </p>
        <div className={styles.actions}>
          <Button type="button" onClick={onAccept} loading={loading}>
            Да, определить
          </Button>
          <Button type="button" variant="outline" onClick={onDecline} disabled={loading}>
            Нет
          </Button>
        </div>
      </div>
    </div>
  );
});

export {
  LocationPromptDialog,
}
