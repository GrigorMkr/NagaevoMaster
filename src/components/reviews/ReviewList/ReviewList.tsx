import { memo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MAX_RATING } from '@/constants';
import type { Review } from '@/types/listing';
import styles from './ReviewList.module.css';
interface ReviewListProps {
    reviews: Review[];
}
const ReviewList = memo(function ReviewList({ reviews }: ReviewListProps) {
    if (reviews.length === 0) {
        return <p>Отзывов пока нет.</p>;
    }
    return (<ul className={styles.list}>
      {reviews.map((review) => (<li key={review.id} className={styles.item}>
          <div className={styles.stars} aria-label={`Оценка ${review.rating} из ${MAX_RATING}`}>
            {'★'.repeat(review.rating)}
            {'☆'.repeat(MAX_RATING - review.rating)}
          </div>
          <p className={styles.text}>{review.text}</p>
          <p className={styles.meta}>
            {review.authorName} ·{' '}
            {format(new Date(review.createdAt), 'd MMMM yyyy', { locale: ru })}
          </p>
        </li>))}
    </ul>);
});

export {
  ReviewList,
}
