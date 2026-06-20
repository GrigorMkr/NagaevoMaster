import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MAX_RATING } from '@/constants';
import { fetchMyReviews } from '@/services/usersApi';
import type { UserReviewItem } from '@/services/usersApi';
import { serviceDetailPath } from '@/constants';
import styles from './MyReviewsPanel.module.css';

function MyReviewsPanel() {
  const [items, setItems] = useState<UserReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReviews()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.panel} aria-labelledby="my-reviews-title">
      <h2 id="my-reviews-title" className={styles.title}>Мои отзывы</h2>
      <p className={styles.desc}>Комментарии к услугам мастеров</p>

      {loading ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Вы ещё не оставляли отзывов</p>
      ) : (
        <ul className={styles.list}>
          {items.map((review) => (
            <li key={review.id} className={styles.item}>
              <Link to={serviceDetailPath(review.listingId)} className={styles.serviceLink}>
                {review.listingTitle}
              </Link>
              <div className={styles.stars} aria-label={`Оценка ${review.rating} из ${MAX_RATING}`}>
                {'★'.repeat(review.rating)}
                {'☆'.repeat(MAX_RATING - review.rating)}
              </div>
              <p className={styles.text}>{review.text}</p>
              <p className={styles.meta}>
                {format(new Date(review.createdAt), 'd MMMM yyyy', { locale: ru })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export {
  MyReviewsPanel,
}
