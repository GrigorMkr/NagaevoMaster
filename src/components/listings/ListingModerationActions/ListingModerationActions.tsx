import { memo, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button/Button';
import {
  deleteModerationListing,
  moderateListingStatus,
} from '@/services/moderationApi';
import type { ListingStatus } from '@/types/listing';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './ListingModerationActions.module.css';

type ModerationAction = 'rejected' | 'deleted' | 'published';

interface ListingModerationActionsProps {
  listingId: string;
  listingTitle?: string;
  status?: ListingStatus;
  variant?: 'compact' | 'bar';
  onDone?: (action: ModerationAction) => void;
}

const ListingModerationActions = memo(function ListingModerationActions({
  listingId,
  listingTitle,
  status,
  variant = 'bar',
  onDone,
}: ListingModerationActionsProps) {
  const [busy, setBusy] = useState(false);
  const label = listingTitle ? `«${listingTitle}»` : 'это объявление';

  const handleReject = async () => {
    if (!window.confirm(`Отклонить ${label}?`)) return;
    setBusy(true);
    try {
      await moderateListingStatus(listingId, 'rejected');
      toast.success('Объявление отклонено');
      onDone?.('rejected');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отклонить'));
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await moderateListingStatus(listingId, 'published');
      toast.success('Объявление одобрено');
      onDone?.('published');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось одобрить'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Удалить ${label} безвозвратно?`)) return;
    setBusy(true);
    try {
      await deleteModerationListing(listingId);
      toast.success('Объявление удалено');
      onDone?.('deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось удалить'));
    } finally {
      setBusy(false);
    }
  };

  const stopClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={variant === 'compact' ? styles.compact : styles.bar}
      role="toolbar"
      aria-label="Модерация объявления"
      onClick={stopClick}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span className={styles.badge}>Модерация</span>
      {status === 'pending' || status === 'rejected' ? (
        <Button type="button" size="sm" loading={busy} onClick={() => void handleApprove()}>
          Одобрить
        </Button>
      ) : null}
      {status !== 'rejected' && status !== 'pending' && (
        <Button type="button" size="sm" variant="outline" loading={busy} onClick={() => void handleReject()}>
          Отклонить
        </Button>
      )}
      <Button type="button" size="sm" variant="danger" loading={busy} onClick={() => void handleDelete()}>
        Удалить
      </Button>
    </div>
  );
});

export {
  ListingModerationActions,
};

export type {
  ModerationAction,
};
