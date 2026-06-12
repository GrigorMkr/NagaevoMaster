import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { ListingCard } from '@/components/listings/ListingCard/ListingCard'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchListingsThunk } from '@/features/listings/listingsThunks'
import { selectListingsItems, selectListingsLoading } from '@/features/listings/listingsSelectors'
import { ECHO_FORM_ACTION } from '@/constants/forms'
import { SERVICE_CATEGORIES } from '@/data/categories'
import { servicesCategoryPath, searchPath, ROUTES } from '@/utils/constants'
import pageStyles from '@/styles/page.module.css'
import styles from './ServicesPage.module.css'

const searchSchema = z.object({
  search: z.string().optional(),
})

type SearchFormData = z.infer<typeof searchSchema>

export function ServicesPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const items = useAppSelector(selectListingsItems)
  const isLoading = useAppSelector(selectListingsLoading)
  const filters = useAppSelector((state) => state.filters)

  const { register, handleSubmit } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { search: filters.query ?? '' },
  })

  useEffect(() => {
    dispatch(fetchListingsThunk({}))
  }, [dispatch])

  const onSubmit = (data: SearchFormData) => {
    navigate(searchPath(data.search ?? ''))
  }

  return (
    <>
      <PageMeta
        title="Услуги"
        description="Каталог услуг и специалистов в поселке Нагаево и окрестностях."
        canonical="/services"
      />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader
            badge="Каталог"
            title="Услуги Нагаево"
            subtitle="9 категорий — от строительства до красоты и здоровья"
          />

          <form
            className={styles.searchForm}
            action={ECHO_FORM_ACTION}
            method="get"
            onSubmit={handleSubmit(onSubmit)}
          >
            <label className="sr-only" htmlFor="services-search">
              Поиск по каталогу
            </label>
            <input
              id="services-search"
              type="search"
              required
              placeholder="Поиск: ремонт, трактор, уборка..."
              className={pageStyles.input}
              {...register('search')}
            />
            <button type="submit" className={styles.searchBtn}>Найти</button>
          </form>

          <div className={styles.categoryGrid}>
            {SERVICE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={servicesCategoryPath(cat.slug)}
                className={styles.categoryCard}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
              </Link>
            ))}
          </div>

          {isLoading && (
            <div className={styles.list}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <>
              <h2 className={styles.listTitle}>Все объявления</h2>
              <div className={styles.list}>
                {items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}

          {!isLoading && items.length === 0 && (
            <div className={pageStyles.empty}>
              <span className={pageStyles.emptyIcon}>🔍</span>
              <p className={pageStyles.emptyTitle}>Каталог скоро наполнится</p>
              <p className={pageStyles.emptyHint}>
                <Link to={ROUTES.ADD_LISTING}>Добавьте объявление</Link> или подключите backend API
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
