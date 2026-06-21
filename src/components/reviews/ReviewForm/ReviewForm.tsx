import { memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button/Button'
import { MAX_RATING } from '@/constants'
import { ECHO_FORM_ACTION } from '@/constants/forms'
import { VALIDATION } from '@/constants/validation'
import { createListingReview } from '@/services/reviewsApi'
import type { Review } from '@/types/listing'
import { getErrorMessage } from '@/utils/errorMessage'
import { validateUserContent } from '@/constants/communityRules'
import pageStyles from '@/styles/page.module.css'
import styles from './ReviewForm.module.css'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Выберите оценку').max(MAX_RATING),
  text: z
    .string()
    .min(
      VALIDATION.MIN_MESSAGE_LENGTH,
      `Комментарий должен быть не короче ${VALIDATION.MIN_MESSAGE_LENGTH} символов`,
    ),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  listingId: string
  authorName: string
  onReviewAdded: (review: Review) => void
}

const ReviewForm = memo(function ReviewForm({
  listingId,
  authorName,
  onReviewAdded,
}: ReviewFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: MAX_RATING },
  })

  const handleReviewSubmit = async (data: ReviewFormData) => {
    const contentError = validateUserContent(data.text)
    if (contentError) {
      toast.error(contentError)
      return
    }
    try {
      const review = await createListingReview(listingId, data, authorName)
      onReviewAdded(review)
      reset({ rating: MAX_RATING, text: '' })
      toast.success('Отзыв опубликован')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить отзыв'))
    }
  }

  return (
    <form
      className={styles.form}
      action={ECHO_FORM_ACTION}
      method="post"
      onSubmit={handleSubmit(handleReviewSubmit)}
      noValidate
    >
      <h3 className={styles.title}>Оставить отзыв</h3>

      <div className={styles.field}>
        <label htmlFor="review-rating">Оценка</label>
        <select
          id="review-rating"
          required
          className={pageStyles.input}
          {...register('rating', { valueAsNumber: true })}
        >
          {Array.from({ length: MAX_RATING }, (_, index) => {
            const value = MAX_RATING - index
            return (
              <option key={value} value={value}>
                {'★'.repeat(value)}
                {'☆'.repeat(MAX_RATING - value)} ({value})
              </option>
            )
          })}
        </select>
        {errors.rating && <span className={pageStyles.formError}>{errors.rating.message}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="review-text">Комментарий</label>
        <textarea
          id="review-text"
          rows={4}
          required
          className={styles.textarea}
          placeholder="Расскажите о качестве услуги"
          {...register('text')}
        />
        {errors.text && <span className={pageStyles.formError}>{errors.text.message}</span>}
      </div>

      <Button type="submit" disabled={isSubmitting} fullWidth>
        {isSubmitting ? 'Отправка…' : 'Опубликовать отзыв'}
      </Button>
    </form>
  )
})

export {
  ReviewForm,
}
