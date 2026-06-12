import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { ListingCard } from '@/components/listings/ListingCard/ListingCard'
import { SKELETON_COUNT_DEFAULT } from '@/constants'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  setListings,
  setListingsLoading,
  setListingsError,
} from '@/features/listings/listingsSlice'
import { fetchListings } from '@/services/listingsApi'
import { getCategoryBySlug, getBeautySubcategory } from '@/data/categories'
import {
  servicesBeautyPath,
  servicesCategoryPath,
  searchPath,
  ROUTES,
} from '@/utils/constants'
import pageStyles from '@/styles/page.module.css'
import styles from './ServicesCategoryPage.module.css'

export function ServicesCategoryPage() {
  const { category: categoryParam, subcategory } = useParams<{
    category?: string
    subcategory?: string
  }>()
  const dispatch = useAppDispatch()
  const { items, isLoading } = useAppSelector((state) => state.listings)

  const category = categoryParam ?? (subcategory ? 'beauty' : undefined)
  const cat = category ? getCategoryBySlug(category) : undefined
  const beautySub =
    category === 'beauty' && subcategory ? getBeautySubcategory(subcategory) : undefined

  const pageTitle = beautySub?.name ?? cat?.name ?? 'Категория'
  const isBeautySubRoute = category === 'beauty' && subcategory

  useEffect(() => {
    if (!category) return
    dispatch(setListingsLoading(true))
    fetchListings({
      category,
      subcategory: isBeautySubRoute ? subcategory : undefined,
    })
      .then((data) => dispatch(setListings(data.items)))
      .catch((err: Error) => dispatch(setListingsError(err.message)))
      .finally(() => dispatch(setListingsLoading(false)))
  }, [category, subcategory, dispatch, isBeautySubRoute])

  if (!cat) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <p className={pageStyles.emptyTitle}>Категория не найдена</p>
          <Link to={ROUTES.SERVICES}>← К каталогу</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageMeta
        title={pageTitle}
        description={`${pageTitle} в поселке Нагаево — специалисты и услуги в радиусе 50 км.`}
        canonical={
          isBeautySubRoute
            ? servicesBeautyPath(subcategory!)
            : servicesCategoryPath(category!)
        }
      />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader
            badge="Каталог"
            title={pageTitle}
            subtitle={cat.description}
          />

          {cat.slug === 'beauty' && !subcategory && (
            <div className={styles.subcategoryGrid}>
              {cat.subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  to={servicesBeautyPath(sub.slug)}
                  className={styles.subcategoryLink}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {cat.slug !== 'beauty' && (
            <div className={styles.subcategoryGrid}>
              {cat.subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  to={searchPath(undefined, { category: cat.slug, subcategory: sub.slug })}
                  className={styles.subcategoryLink}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {isLoading && (
            <div className={styles.grid}>
              {Array.from({ length: SKELETON_COUNT_DEFAULT }, (_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className={pageStyles.empty}>
              <p className={pageStyles.emptyTitle}>Объявлений в этой категории пока нет</p>
              <p className={pageStyles.emptyHint}>Скоро появятся мастера из Нагаево</p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className={styles.grid}>
              {items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
