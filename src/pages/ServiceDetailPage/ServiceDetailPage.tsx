import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { Button } from '@/components/ui/Button/Button'
import { ButtonLink } from '@/components/ui/Button/ButtonLink'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { AuthRequiredPanel } from '@/components/auth/AuthRequiredPanel/AuthRequiredPanel'
import { FavoriteButton } from '@/components/listings/FavoriteButton/FavoriteButton'
import { ListingModerationActions } from '@/components/listings/ListingModerationActions/ListingModerationActions'
import { ListingCard } from '@/components/listings/ListingCard/ListingCard'
import { ListingAuthorRow } from '@/components/listings/ListingAuthorRow/ListingAuthorRow'
import { AddFriendButton } from '@/components/friends/AddFriendButton/AddFriendButton'
import { ListingGallery } from '@/components/listings/ListingGallery/ListingGallery'
import { ReviewForm } from '@/components/reviews/ReviewForm/ReviewForm'
import { ReviewList } from '@/components/reviews/ReviewList/ReviewList'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchListingByIdThunk, fetchListingsThunk } from '@/features/listings/listingsThunks'
import { removeListingFromStore } from '@/features/listings/listingsSlice'
import {
  selectCurrentListing,
  selectListingsLoading,
  selectSimilarListings,
} from '@/features/listings/listingsSelectors'
import { selectCurrentUser, selectIsAuthenticated, selectCanModerate } from '@/features/user/userSelectors'
import { useListingReviews } from '@/hooks/useListingReviews'
import { fetchListingReviews } from '@/services/reviewsApi'
import { reportListing } from '@/services/listingsWriteApi'
import type { Listing, Review } from '@/types/listing'
import { SortBy } from '@/enums/sort'
import { META_DESCRIPTION_MAX_LENGTH } from '@/constants'
import { ROUTES, messageWithUserPath, serviceDetailPath } from '@/utils/constants'
import tileGrid from '@/styles/tileGrid.module.css'
import { getErrorMessage } from '@/utils/errorMessage'
import { Reveal } from '@/components/ui/Reveal/Reveal'
import pageStyles from '@/styles/page.module.css'
import styles from './ServiceDetailPage.module.css'

interface ServiceDetailViewProps {
  listing: Listing
  similarListings: Listing[]
}

function ServiceDetailView({ listing, similarListings }: ServiceDetailViewProps) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const currentUser = useAppSelector(selectCurrentUser)
  const canModerate = useAppSelector(selectCanModerate)
  const isOwner = currentUser?.id === listing.userId
  const [showReviews, setShowReviews] = useState(isAuthenticated && (!isOwner || canModerate))
  const {
    reviews: listingReviews,
    setReviews: setListingReviews,
    loading: reviewsLoading,
  } = useListingReviews(listing.id, isAuthenticated && (!isOwner || canModerate))

  const reloadReviews = useCallback(() => {
    void fetchListingReviews(listing.id)
      .then(setListingReviews)
      .catch(() => setListingReviews([]))
  }, [listing.id, setListingReviews])

  const handleReportClick = async () => {
    if (isOwner) {
      toast.error('Нельзя пожаловаться на своё объявление')
      return
    }
    try {
      await reportListing(listing.id)
      toast.success('Жалоба отправлена модератору')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить жалобу'))
    }
  }

  const handleReviewsToggle = () => {
    if (!isAuthenticated || isOwner) return
    setShowReviews((current) => !current)
  }

  const handleReviewAdded = useCallback((review: Review) => {
    setListingReviews((current) => [review, ...current])
  }, [setListingReviews])

  const handleModerationDone = useCallback((action: 'rejected' | 'deleted' | 'published') => {
    dispatch(removeListingFromStore(listing.id))
    if (action === 'deleted' || action === 'rejected') {
      navigate(ROUTES.SERVICES)
    }
  }, [dispatch, listing.id, navigate])

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
              ← К каталогу услуг
            </Link>
          </Reveal>

          <Reveal delay={80}>
            <article className={styles.card}>
            <header className={styles.header}>
              <h1 className="titlePage">{listing.title}</h1>
              <div className={styles.headerActions}>
                {isAuthenticated && !isOwner && (
                  <FavoriteButton listingId={listing.id} variant="inline" />
                )}
                {listing.isVerified && <span className={styles.verified}>✓ Проверен</span>}
              </div>
            </header>

            {listing.author && (
              <div className={styles.authorBlock}>
                <ListingAuthorRow author={listing.author} />
                {isAuthenticated && !isOwner && listing.author.id && (
                  <div className={styles.authorActions}>
                    <AddFriendButton userId={listing.author.id} />
                    <ButtonLink
                      to={messageWithUserPath(listing.author.id)}
                      size="sm"
                      variant="secondary"
                    >
                      Написать
                    </ButtonLink>
                  </div>
                )}
              </div>
            )}

            {canModerate && (
              <ListingModerationActions
                listingId={listing.id}
                listingTitle={listing.title}
                status={listing.status}
                onDone={handleModerationDone}
              />
            )}

            <ListingGallery images={listing.images} title={listing.title} />

            <div className={styles.priceRow}>
              <span className={styles.price}>
                от {listing.priceFrom} ₽ / {listing.unit}
              </span>
              {!isOwner && (
                isAuthenticated ? (
                  <button
                    type="button"
                    className={styles.ratingButton}
                    onClick={handleReviewsToggle}
                    aria-expanded={showReviews}
                  >
                    ★ {listing.rating.toFixed(1)} ({listing.reviewsCount} отзывов)
                  </button>
                ) : (
                  <span className={styles.ratingStatic}>
                    ★ {listing.rating.toFixed(1)} ({listing.reviewsCount} отзывов)
                  </span>
                )
              )}
            </div>

            {isOwner && (
              <p className={styles.ownerNote}>
                Это ваше объявление — отзывы и рейтинг видны только другим пользователям.
              </p>
            )}

            {isAuthenticated && (!isOwner || canModerate) && (showReviews || canModerate) && (
              <section className={styles.reviews} aria-label="Отзывы клиентов">
                <h2 className={styles.reviewsTitle}>Отзывы</h2>
                {reviewsLoading ? (
                  <p className="textMuted">Загрузка отзывов…</p>
                ) : (
                  <ReviewList
                    reviews={listingReviews}
                    canModerate={canModerate}
                    onChanged={reloadReviews}
                  />
                )}
                {currentUser && !isOwner && (
                  <ReviewForm
                    listingId={listing.id}
                    authorName={currentUser.name}
                    onReviewAdded={handleReviewAdded}
                  />
                )}
              </section>
            )}

            {!isAuthenticated && !isOwner && (
              <div className={styles.reviewsGate}>
                <AuthRequiredPanel title="Войдите, чтобы читать отзывы" />
              </div>
            )}

            <p className={styles.desc}>{listing.description}</p>
            <p className={styles.address}>📍 {listing.location.address}</p>

            <div className={styles.contact}>
              <p className={styles.phone}>
                📞{' '}
                <a href={`tel:${listing.phone.replace(/\s/g, '')}`}>{listing.phone}</a>
              </p>
            </div>

            {isAuthenticated && !isOwner && (
              <div className={styles.actions}>
                <Button type="button" variant="outline" size="sm" onClick={handleReportClick}>
                  Пожаловаться
                </Button>
              </div>
            )}
          </article>
          </Reveal>

          {similarListings.length > 0 && (
            <Reveal delay={120}>
              <section className={styles.similar}>
                <h2 className="titleSection">Похожие услуги</h2>
                <div className={tileGrid.grid}>
                  {similarListings.map((item) => (
                    <ListingCard key={item.id} listing={item} showFavorite={false} />
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
    dispatch(fetchListingsThunk({ sortBy: SortBy.Popular }))
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
