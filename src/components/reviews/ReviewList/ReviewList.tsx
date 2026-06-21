import { memo, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MAX_RATING } from '@/constants';
import { Button } from '@/components/ui/Button/Button';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { deleteModerationReview, editModerationReview } from '@/services/moderationApi';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { getErrorMessage } from '@/utils/errorMessage';
import type { Review } from '@/types/listing';
import styles from './ReviewList.module.css';

interface ReviewListProps {
  reviews: Review[];
  canModerate?: boolean;
  onChanged?: () => void;
}

const ReviewList = memo(function ReviewList({
  reviews,
  canModerate = false,
  onChanged,
}: ReviewListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (reviews.length === 0) {
    return <p className={styles.empty}>Отзывов пока нет</p>;
  }

  const handleDelete = async (review: Review) => {
    if (!window.confirm('Удалить отзыв?')) return;
    setBusyId(review.id);
    try {
      await deleteModerationReview(review.id);
      toast.success('Отзыв удалён');
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось удалить отзыв'));
    } finally {
      setBusyId(null);
    }
  };

  const handleEdit = async (review: Review) => {
    const text = window.prompt('Текст отзыва', review.text);
    if (!text || text.trim() === review.text) return;
    setBusyId(review.id);
    try {
      await editModerationReview(review.id, { text: text.trim() });
      toast.success('Отзыв обновлён');
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось изменить отзыв'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ul className={styles.list}>
      {reviews.map((review) => (
        <li key={review.id} className={styles.item}>
          <div className={styles.head}>
            <UserAvatar
              name={review.authorName}
              src={resolveAuthorAvatar(review.authorName, review.authorName)}
              size="sm"
            />
            <div className={styles.headBody}>
              <div className={styles.stars} aria-label={`Оценка ${review.rating} из ${MAX_RATING}`}>
                {'★'.repeat(review.rating)}
              </div>
              <p className={styles.meta}>
                {review.authorName} · {format(new Date(review.createdAt), 'd MMM yyyy', { locale: ru })}
              </p>
            </div>
          </div>
          <p className={styles.text}>{review.text}</p>
          {canModerate && (
            <div className={styles.modActions}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={busyId === review.id}
                onClick={() => void handleEdit(review)}
              >
                Изменить
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                loading={busyId === review.id}
                onClick={() => void handleDelete(review)}
              >
                Удалить
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
});

export {
  ReviewList,
};
