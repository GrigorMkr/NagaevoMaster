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
import { removeListingFromStore, updateListingInStore } from '@/features/listings/listingsSlice'
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
import { getErrorMessage } from '@/utils/errorMessage'
import { formatListingPrice } from '@/utils/listingPriceLabel'
import { ListingSocialBar } from '@/components/listings/ListingSocialBar/ListingSocialBar'
import { DetailBackdropLayout } from '@/components/layout/DetailBackdropLayout/DetailBackdropLayout'
import { HorizontalCarousel } from '@/components/ui/HorizontalCarousel/HorizontalCarousel'
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

  const handleEdited = useCallback((updated: Listing) => {
    dispatch(updateListingInStore(updated))
  }, [dispatch])

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
          <DetailBackdropLayout className={styles.shell}>
            <Reveal delay={40}>
              <Link to={ROUTES.SERVICES} className={styles.back} data-detail-surface>
                ← Каталог
              </Link>
            </Reveal>

            <Reveal delay={60}>
              <article className={styles.sheet} data-detail-surface>
                <header className={styles.sheetTop}>
                  <h1 className={styles.title}>{listing.title}</h1>
                  <div className={styles.headerActions}>
                    {isAuthenticated && !isOwner && (
                      <FavoriteButton listingId={listing.id} variant="inline" />
                    )}
                    {listing.isVerified && <span className={styles.verified}>✓ Проверен</span>}
                  </div>
                </header>

                {canModerate && (
                  <ListingModerationActions
                    listingId={listing.id}
                    listing={listing}
                    listingTitle={listing.title}
                    status={listing.status}
                    onDone={handleModerationDone}
                    onEdited={handleEdited}
                  />
                )}

                <div className={styles.body}>
                  <div className={styles.heroGrid}>
                    <ListingGallery images={listing.images} title={listing.title} variant="compact" />

                    <div>
                      <div className={styles.metaRow}>
                        <span className={styles.priceChip}>
                          {formatListingPrice(listing)}
                        </span>
                        {!isOwner && (
                          isAuthenticated ? (
                            <button
                              type="button"
                              className={styles.ratingButton}
                              onClick={handleReviewsToggle}
                              aria-expanded={showReviews}
                            >
                              ★ {listing.rating.toFixed(1)} · {listing.reviewsCount}
                            </button>
                          ) : (
                            <span className={styles.ratingStatic}>
                              ★ {listing.rating.toFixed(1)} · {listing.reviewsCount}
                            </span>
                          )
                        )}
                      </div>

                      <ListingSocialBar listing={listing} />

                      {listing.author && (
                        <div className={styles.authorBlock}>
                          <ListingAuthorRow author={listing.author} compact />
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

                      <p className={styles.desc}>{listing.description}</p>

                      <div className={styles.contacts}>
                        <span className={styles.contactPill}>
                          📍 {listing.location.address}
                        </span>
                        <a
                          className={styles.contactPill}
                          href={`tel:${listing.phone.replace(/\s/g, '')}`}
                        >
                          📞 {listing.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {isOwner && (
                    <p className={styles.ownerNote}>
                      Это ваше объявление — отзывы видны только другим пользователям.
                    </p>
                  )}

                  {isAuthenticated && (!isOwner || canModerate) && (showReviews || canModerate) && (
                    <section className={styles.reviews} aria-label="Отзывы">
                      <h2 className={styles.reviewsTitle}>Отзывы</h2>
                      {reviewsLoading ? (
                        <p className="textMuted">Загрузка…</p>
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

                  {isAuthenticated && !isOwner && (
                    <div className={styles.actions}>
                      <Button type="button" variant="outline" size="sm" onClick={handleReportClick}>
                        Пожаловаться
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            </Reveal>

            {similarListings.length > 0 && (
              <Reveal delay={100}>
                <section className={styles.similar} data-detail-surface>
                  <h2 className={styles.similarTitle}>Похожие</h2>
                  <HorizontalCarousel
                    ariaLabel="Похожие объявления"
                    slideClassName={styles.similarSlide}
                  >
                    {similarListings.map((item) => (
                      <ListingCard key={item.id} listing={item} showFavorite={false} variant="tile" />
                    ))}
                  </HorizontalCarousel>
                </section>
              </Reveal>
            )}
          </DetailBackdropLayout>
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
