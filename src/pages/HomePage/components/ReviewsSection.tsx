import { memo, useCallback, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { AuthRequiredPanel } from '@/components/auth/AuthRequiredPanel/AuthRequiredPanel'
import { ReviewDialog } from '@/components/reviews/ReviewDialog/ReviewDialog'
import { selectIsAuthenticated } from '@/features/user/userSelectors'
import { MAX_RATING } from '@/constants'
import { HOME_FEATURED_REVIEWS, type MockReview } from '@/data/mock/reviews'
import { SectionHead } from './SectionHead'
import styles from '../HomePage.module.css'

const ReviewsSection = memo(function ReviewsSection() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
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

      {isAuthenticated ? (
        <>
          <div className={styles.reviewsTrack}>
            {HOME_FEATURED_REVIEWS.map((review) => (
              <button
                key={review.id}
                type="button"
                className={styles.reviewCard}
                onClick={() => handleReviewClick(review)}
              >
                <div className={styles.reviewStars}>
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(MAX_RATING - review.rating)}
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
        </>
      ) : (
        <AuthRequiredPanel title="Войдите, чтобы читать отзывы" />
      )}
    </div>
  )
})

export {
  ReviewsSection,
}
