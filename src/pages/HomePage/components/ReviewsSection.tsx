import { memo, useCallback, useState } from 'react'
import { MOCK_REVIEWS, type MockReview } from '@/data/mock/reviews'
import { ReviewDialog } from '@/components/reviews/ReviewDialog/ReviewDialog'
import { SectionHead } from './SectionHead'
import styles from '../HomePage.module.css'

export const ReviewsSection = memo(function ReviewsSection() {
  const [selectedReview, setSelectedReview] = useState<MockReview | null>(null)

  const handleReviewClick = useCallback((review: MockReview) => {
    setSelectedReview(review)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setSelectedReview(null)
  }, [])

  return (
    <div className={styles.contentBlock}>
      <SectionHead badge="Отзывы" title="Что говорят жители" />

      <div className={styles.reviewsTrack}>
        {MOCK_REVIEWS.map((review) => (
          <button
            key={review.id}
            type="button"
            className={styles.reviewCard}
            onClick={() => handleReviewClick(review)}
          >
            <div className={styles.reviewStars}>
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </div>
            <p className={styles.reviewText}>{review.text}</p>
            <p className={styles.reviewAuthor}>
              {review.authorName} · {review.serviceTitle}
            </p>
            <span className={styles.reviewMore}>Читать полностью</span>
          </button>
        ))}
      </div>

      <ReviewDialog review={selectedReview} onClose={handleCloseDialog} />
    </div>
  )
})
