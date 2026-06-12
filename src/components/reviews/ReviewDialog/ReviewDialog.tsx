import { memo, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { MAX_RATING } from '@/constants'
import type { MockReview } from '@/data/mock/reviews'
import styles from './ReviewDialog.module.css'

interface ReviewDialogProps {
  review: MockReview | null
  onClose: () => void
}

export const ReviewDialog = memo(function ReviewDialog({ review, onClose }: ReviewDialogProps) {
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!review) {
      return undefined
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [review, handleKeyDown])

  if (!review) {
    return null
  }

  const reviewDate = format(new Date(review.createdAt), 'd MMMM yyyy', { locale: ru })

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
      >
        <div className={styles.header}>
          <h3 id="review-dialog-title" className={styles.title}>
            Отзыв о «{review.serviceTitle}»
          </h3>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Закрыть отзыв"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles.stars} aria-label={`Оценка ${review.rating} из ${MAX_RATING}`}>
          {'★'.repeat(review.rating)}
          {'☆'.repeat(MAX_RATING - review.rating)}
        </div>

        <p className={styles.text}>{review.text}</p>
        <p className={styles.meta}>
          {review.authorName} · {reviewDate}
        </p>
      </div>
    </div>
  )
})
