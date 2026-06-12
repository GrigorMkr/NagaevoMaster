import { useCallback, useEffect } from 'react'

import { useSearchParams } from 'react-router-dom'

import { PageMeta } from '@/components/ui/PageMeta/PageMeta'

import { PageHeader } from '@/components/ui/PageHeader/PageHeader'

import { Button } from '@/components/ui/Button/Button'

import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { setSearchParams, resetSearchParams } from '@/features/filters/filtersSlice'

import { selectSearchParams } from '@/features/filters/filtersSelectors'

import { fetchListingsThunk } from '@/features/listings/listingsThunks'

import { selectListingsItems, selectListingsLoading } from '@/features/listings/listingsSelectors'

import { ECHO_FORM_ACTION } from '@/constants/forms'

import { SortBy } from '@/enums/sort'

import type { DistanceFilter, RatingFilter } from '@/types/search'

import pageStyles from '@/styles/page.module.css'

import { ListingResults } from './components/ListingResults'

import { SearchFilters } from './components/SearchFilters'

import { SortControls } from './components/SortControls'

import styles from './SearchPage.module.css'



function parseNumberParam(value: string | null): number | null {

  if (!value) return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null

}



export function SearchPage() {

  const [urlParams, setUrlParams] = useSearchParams()

  const dispatch = useAppDispatch()

  const filters = useAppSelector(selectSearchParams)

  const items = useAppSelector(selectListingsItems)

  const isLoading = useAppSelector(selectListingsLoading)



  useEffect(() => {

    const query = urlParams.get('query') ?? ''

    const category = urlParams.get('category')

    const subcategory = urlParams.get('subcategory')

    const sortBy = (urlParams.get('sortBy') as SortBy) || SortBy.Rating

    const page = Number(urlParams.get('page') ?? 1)

    const priceMin = parseNumberParam(urlParams.get('priceMin'))

    const priceMax = parseNumberParam(urlParams.get('priceMax'))

    const rating = Number(urlParams.get('rating') ?? 0) as RatingFilter

    const distanceRaw = urlParams.get('distance')

    const distance = distanceRaw ? (Number(distanceRaw) as DistanceFilter) : null



    const nextParams = {

      query,

      category: category ?? null,

      subcategory: subcategory ?? null,

      sortBy,

      page,

      priceMin,

      priceMax,

      rating,

      distance,

    }



    dispatch(setSearchParams(nextParams))

    dispatch(fetchListingsThunk(nextParams))

  }, [urlParams, dispatch])



  const buildUrlParams = useCallback(() => {

    const params: Record<string, string> = {

      sortBy: filters.sortBy,

      page: String(filters.page),

    }

    if (filters.query) params.query = filters.query

    if (filters.category) params.category = filters.category

    if (filters.subcategory) params.subcategory = filters.subcategory

    if (filters.priceMin !== null) params.priceMin = String(filters.priceMin)

    if (filters.priceMax !== null) params.priceMax = String(filters.priceMax)

    if (filters.rating > 0) params.rating = String(filters.rating)

    if (filters.distance !== null) params.distance = String(filters.distance)

    return params

  }, [filters])



  const handleSearch = useCallback(

    (event: React.FormEvent<HTMLFormElement>) => {

      event.preventDefault()

      setUrlParams(buildUrlParams())

    },

    [buildUrlParams, setUrlParams],

  )



  const handleSort = useCallback(

    (sortBy: SortBy) => {

      const params = buildUrlParams()

      params.sortBy = sortBy

      setUrlParams(params)

    },

    [buildUrlParams, setUrlParams],

  )



  const handleApplyFilters = useCallback(() => {

    setUrlParams(buildUrlParams())

  }, [buildUrlParams, setUrlParams])



  const handleReset = useCallback(() => {

    dispatch(resetSearchParams())

    setUrlParams({})

  }, [dispatch, setUrlParams])



  return (

    <>

      <PageMeta

        title="Поиск услуг"

        description="Поиск специалистов и услуг в поселке Нагаево с фильтрами по категории, цене и рейтингу."

        canonical="/search"

      />



      <div className={pageStyles.page}>

        <div className="container">

          <PageHeader

            badge="Поиск"

            title="Найти услугу"

            subtitle="Фильтры сохраняются в адресной строке"

          />



          <form

            className={styles.searchForm}

            action={ECHO_FORM_ACTION}

            method="get"

            onSubmit={handleSearch}

          >

            <label className="sr-only" htmlFor="search-query">

              Поиск услуг

            </label>

            <input

              id="search-query"

              name="query"

              type="search"

              required

              className={pageStyles.input}

              placeholder="Ремонт, трактор, электрик..."

              value={filters.query}

              onChange={(event) => dispatch(setSearchParams({ query: event.target.value }))}

            />

            <Button type="submit">Найти</Button>

            <Button type="button" variant="outline" onClick={handleReset}>

              Сбросить

            </Button>

          </form>



          <SearchFilters onApply={handleApplyFilters} />

          <SortControls activeSort={filters.sortBy} onSort={handleSort} />

          <ListingResults items={items ?? []} isLoading={isLoading} />

        </div>

      </div>

    </>

  )

}

