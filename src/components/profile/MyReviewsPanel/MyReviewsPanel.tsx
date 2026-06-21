import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MAX_RATING } from '@/constants';
import { ProfileExpandableSection } from '@/components/profile/ProfileExpandableSection/ProfileExpandableSection';
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
    <ProfileExpandableSection title="Мои отзывы" count={items.length} loading={loading}>
      {items.length === 0 ? (
        <p className={styles.empty}>Вы ещё не оставляли отзывов</p>
      ) : (
        <ul className={styles.list}>
          {items.map((review) => (
            <li key={review.id} className={styles.item}>
              <div className={styles.head}>
                <Link to={serviceDetailPath(review.listingId)} className={styles.serviceLink}>
                  {review.listingTitle}
                </Link>
                <span className={styles.stars} aria-label={`Оценка ${review.rating} из ${MAX_RATING}`}>
                  {'★'.repeat(review.rating)}
                </span>
              </div>
              <p className={styles.text}>{review.text}</p>
              <p className={styles.meta}>
                {format(new Date(review.createdAt), 'd MMM yyyy', { locale: ru })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ProfileExpandableSection>
  );
}

export {
  MyReviewsPanel,
};
