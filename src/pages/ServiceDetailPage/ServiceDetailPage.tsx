import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { Button } from '@/components/ui/Button/Button'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { AuthRequiredPanel } from '@/components/auth/AuthRequiredPanel/AuthRequiredPanel'
import { FavoriteButton } from '@/components/listings/FavoriteButton/FavoriteButton'
import { ListingCard } from '@/components/listings/ListingCard/ListingCard'
import { ListingAuthorRow } from '@/components/listings/ListingAuthorRow/ListingAuthorRow'
import { ListingGallery } from '@/components/listings/ListingGallery/ListingGallery'
import { ReviewForm } from '@/components/reviews/ReviewForm/ReviewForm'
import { ReviewList } from '@/components/reviews/ReviewList/ReviewList'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchListingByIdThunk, fetchListingsThunk } from '@/features/listings/listingsThunks'
import {
  selectCurrentListing,
  selectListingsLoading,
  selectSimilarListings,
} from '@/features/listings/listingsSelectors'
import { selectCurrentUser, selectIsAuthenticated } from '@/features/user/userSelectors'
import { useListingReviews } from '@/hooks/useListingReviews'
import { reportListing } from '@/services/listingsWriteApi'
import type { Listing, Review } from '@/types/listing'
import { META_DESCRIPTION_MAX_LENGTH } from '@/constants'
import {
  CAPTCHA_EXPECTED_ANSWER,
  CAPTCHA_QUESTION,
  ECHO_FORM_ACTION,
} from '@/constants/forms'
import { ROUTES, serviceDetailPath } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errorMessage'
import { Reveal } from '@/components/ui/Reveal/Reveal'
import pageStyles from '@/styles/page.module.css'
import styles from './ServiceDetailPage.module.css'

interface ServiceDetailViewProps {
  listing: Listing
  similarListings: Listing[]
}

function ServiceDetailView({ listing, similarListings }: ServiceDetailViewProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const currentUser = useAppSelector(selectCurrentUser)
  const [showPhone, setShowPhone] = useState(false)
  const [showReviews, setShowReviews] = useState(isAuthenticated)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const {
    reviews: listingReviews,
    setReviews: setListingReviews,
    loading: reviewsLoading,
  } = useListingReviews(listing.id, isAuthenticated)

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
    try {
      await reportListing(listing.id)
      toast.success('Жалоба отправлена модератору')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить жалобу'))
    }
  }

  const handleReviewsToggle = () => {
    if (!isAuthenticated) return
    setShowReviews((current) => !current)
  }

  const handleReviewAdded = useCallback((review: Review) => {
    setListingReviews((current) => [review, ...current])
  }, [setListingReviews])

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
          <Reveal delay={40}>
            <Link to={ROUTES.SERVICES} className={styles.back}>
              ← Каталог услуг
            </Link>
          </Reveal>

          <Reveal delay={80}>
            <article className={styles.card}>
            <header className={styles.header}>
              <h1 className="titlePage">{listing.title}</h1>
              <div className={styles.headerActions}>
                {isAuthenticated && <FavoriteButton listingId={listing.id} variant="inline" />}
                {listing.isVerified && <span className={styles.verified}>✓ Проверен</span>}
              </div>
            </header>

            {listing.author && (
              <div className={styles.authorBlock}>
                <ListingAuthorRow author={listing.author} />
              </div>
            )}

            <ListingGallery images={listing.images} title={listing.title} />

            <div className={styles.priceRow}>
              <span className={styles.price}>
                от {listing.priceFrom} ₽ / {listing.unit}
              </span>
              {isAuthenticated ? (
                <button
                  type="button"
                  className={styles.ratingButton}
                  onClick={handleReviewsToggle}
                  aria-expanded={showReviews}
                >
                  ★ {listing.rating} ({listing.reviewsCount} отзывов)
                </button>
              ) : (
                <span className={styles.ratingStatic}>
                  ★ {listing.rating} ({listing.reviewsCount} отзывов)
                </span>
              )}
            </div>

            {isAuthenticated && showReviews && (
              <section className={styles.reviews} aria-label="Отзывы клиентов">
                <h2 className={styles.reviewsTitle}>Отзывы</h2>
                {reviewsLoading ? (
                  <p className="textMuted">Загрузка отзывов…</p>
                ) : (
                  <ReviewList reviews={listingReviews} />
                )}
                {currentUser && (
                  <ReviewForm
                    listingId={listing.id}
                    authorName={currentUser.name}
                    onReviewAdded={handleReviewAdded}
                  />
                )}
              </section>
            )}

            {!isAuthenticated && (
              <div className={styles.reviewsGate}>
                <AuthRequiredPanel
                  title="Отзывы только для авторизованных"
                  description="Войдите в аккаунт, чтобы читать отзывы и оставлять комментарии об услуге."
                />
              </div>
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
                  <p>
                    Для показа телефона решите: {CAPTCHA_QUESTION} = ?
                  </p>
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
                  📞{' '}
                  <a href={`tel:${listing.phone.replace(/\s/g, '')}`}>{listing.phone}</a>
                </p>
              )}
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="outline" size="sm" onClick={handleReportClick}>
                Пожаловаться
              </Button>
            </div>
          </article>
          </Reveal>

          {similarListings.length > 0 && (
            <Reveal delay={120}>
              <section className={styles.similar}>
                <h2 className="titleSection">Похожие услуги</h2>
                <div className={`${styles.similarGrid} motion-stagger`}>
                  {similarListings.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </section>
            </Reveal>
          )}
        </div>
      </div>
    </>
  )
}

function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const listing = useAppSelector(selectCurrentListing)
  const isLoading = useAppSelector(selectListingsLoading)
  const similarListings = useAppSelector((state) =>
    id ? selectSimilarListings(id)(state) : [],
  )

  useEffect(() => {
    if (!id) return
    dispatch(fetchListingByIdThunk(id))
    dispatch(fetchListingsThunk({}))
  }, [id, dispatch])

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

  if (!listing || !id) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <p className={pageStyles.emptyTitle}>Объявление не найдено</p>
          <Link to={ROUTES.SERVICES}>← К каталогу</Link>
        </div>
      </div>
    )
  }

  return <ServiceDetailView key={id} listing={listing} similarListings={similarListings} />
}

export {
  ServiceDetailPage,
}
