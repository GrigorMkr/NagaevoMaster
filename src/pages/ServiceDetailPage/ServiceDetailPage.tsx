import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { Button } from '@/components/ui/Button/Button'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { ListingCard } from '@/components/listings/ListingCard/ListingCard'
import { ReviewList } from '@/components/reviews/ReviewList/ReviewList'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchListingByIdThunk, fetchListingsThunk } from '@/features/listings/listingsThunks'
import {
  selectCurrentListing,
  selectListingsLoading,
  selectSimilarListings,
} from '@/features/listings/listingsSelectors'
import { fetchListingReviews } from '@/services/reviewsApi'
import { reportListing } from '@/services/listingsWriteApi'
import { META_DESCRIPTION_MAX_LENGTH } from '@/constants'
import {
  CAPTCHA_EXPECTED_ANSWER,
  CAPTCHA_QUESTION,
  ECHO_FORM_ACTION,
} from '@/constants/forms'
import { ROUTES, serviceDetailPath } from '@/utils/constants'
import pageStyles from '@/styles/page.module.css'
import styles from './ServiceDetailPage.module.css'

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const listing = useAppSelector(selectCurrentListing)
  const isLoading = useAppSelector(selectListingsLoading)
  const similarListings = useAppSelector((state) =>
    id ? selectSimilarListings(id)(state) : [],
  )
  const [showPhone, setShowPhone] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [listingReviews, setListingReviews] = useState<Awaited<ReturnType<typeof fetchListingReviews>>>([])

  useEffect(() => {
    if (!id) return
    dispatch(fetchListingByIdThunk(id))
    dispatch(fetchListingsThunk({}))
  }, [id, dispatch])

  useEffect(() => {
    setShowReviews(false)
    setShowPhone(false)
    setCaptchaAnswer('')
  }, [id])

  useEffect(() => {
    if (!listing?.id) {
      setListingReviews([])
      return
    }

    fetchListingReviews(listing.id)
      .then(setListingReviews)
      .catch(() => setListingReviews([]))
  }, [listing?.id])

  const handleShowPhone = () => {
    if (captchaAnswer.trim() !== CAPTCHA_EXPECTED_ANSWER) {
      toast.error(`Неверный ответ. Сколько будет ${CAPTCHA_QUESTION}?`)
      return
    }
    setShowPhone(true)
    toast.success('Контакт открыт')
  }

  const handleCaptchaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCaptchaAnswer(event.target.value)
  }

  const handleReportClick = async () => {
    if (!listing) return
    try {
      await reportListing(listing.id)
      toast.success('Жалоба отправлена модератору')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось отправить жалобу')
    }
  }

  const handleReviewsToggle = () => {
    setShowReviews((current) => !current)
  }

  if (isLoading && !listing) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <Skeleton variant="title" />
          <Skeleton variant="text" />
          <Skeleton variant="card" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <p className={pageStyles.emptyTitle}>Объявление не найдено</p>
          <Link to={ROUTES.SERVICES}>← К каталогу</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageMeta
        title={listing.title}
        description={`${listing.description.slice(0, META_DESCRIPTION_MAX_LENGTH)}. Цена от ${listing.priceFrom}₽ за ${listing.unit}.`}
        keywords={`${listing.category}, ${listing.subcategory}, Нагаево, услуги`}
        canonical={serviceDetailPath(listing.id)}
      />

      <div className={pageStyles.page}>
        <div className="container">
          <Link to={ROUTES.SERVICES} className={styles.back}>← Каталог услуг</Link>

          <article className={styles.card}>
            <header className={styles.header}>
              <h1 className="titlePage">{listing.title}</h1>
              {listing.isVerified && <span className={styles.verified}>✓ Проверен</span>}
            </header>

            <div className={styles.priceRow}>
              <span className={styles.price}>
                от {listing.priceFrom} ₽ / {listing.unit}
              </span>
              <button
                type="button"
                className={styles.ratingButton}
                onClick={handleReviewsToggle}
                aria-expanded={showReviews}
              >
                ★ {listing.rating} ({listing.reviewsCount} отзывов)
              </button>
            </div>

            {showReviews && (
              <section className={styles.reviews} aria-label="Отзывы клиентов">
                <h2 className={styles.reviewsTitle}>Отзывы</h2>
                <ReviewList reviews={listingReviews} />
              </section>
            )}

            <p className={styles.desc}>{listing.description}</p>
            <p className={styles.address}>📍 {listing.location.address}</p>

            <div className={styles.contact}>
              {!showPhone ? (
                <form
                  className={styles.captcha}
                  action={ECHO_FORM_ACTION}
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleShowPhone()
                  }}
                >
                  <p>Для показа телефона решите: {CAPTCHA_QUESTION} = ?</p>
                  <label className="sr-only" htmlFor="captcha-answer">
                    Ответ на капчу
                  </label>
                  <input
                    id="captcha-answer"
                    name="captcha"
                    type="text"
                    required
                    value={captchaAnswer}
                    onChange={handleCaptchaChange}
                    className={pageStyles.input}
                    placeholder="Ответ"
                  />
                  <Button type="submit">Показать контакты</Button>
                </form>
              ) : (
                <p className={styles.phone}>
                  📞 <a href={`tel:${listing.phone.replace(/\s/g, '')}`}>{listing.phone}</a>
                </p>
              )}
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="outline" size="sm" onClick={handleReportClick}>
                Пожаловаться
              </Button>
            </div>
          </article>

          {similarListings.length > 0 && (
            <section className={styles.similar}>
              <h2 className="titleSection">Похожие услуги</h2>
              <div className={styles.similarGrid}>
                {similarListings.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
