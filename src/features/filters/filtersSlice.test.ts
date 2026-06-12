import { describe, expect, it } from 'vitest'
import filtersReducer, { resetSearchParams, setSearchParams } from './filtersSlice'
import { DEFAULT_SEARCH_PARAMS } from '@/types/search'
import { SortBy } from '@/enums/sort'
import { DistanceFilter, RatingFilter } from '@/enums/filters'

describe('filters reducer', () => {
  it('returns initial state', () => {
    expect(filtersReducer(undefined, { type: 'unknown' })).toEqual(DEFAULT_SEARCH_PARAMS)
  })

  it('handles setSearchParams', () => {
    const state = filtersReducer(
      DEFAULT_SEARCH_PARAMS,
      setSearchParams({
        query: 'электрик',
        sortBy: SortBy.PriceAsc,
        priceMin: 1000,
        priceMax: 5000,
        rating: RatingFilter.Four,
        distance: DistanceFilter.Ten,
      }),
    )
    expect(state.query).toBe('электрик')
    expect(state.sortBy).toBe(SortBy.PriceAsc)
    expect(state.priceMin).toBe(1000)
    expect(state.priceMax).toBe(5000)
    expect(state.rating).toBe(RatingFilter.Four)
    expect(state.distance).toBe(DistanceFilter.Ten)
  })

  it('handles resetSearchParams', () => {
    const modified = filtersReducer(DEFAULT_SEARCH_PARAMS, setSearchParams({ query: 'test' }))
    const state = filtersReducer(modified, resetSearchParams())
    expect(state).toEqual(DEFAULT_SEARCH_PARAMS)
  })
})
