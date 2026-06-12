import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { SortBy } from '@/enums/sort'
import { fetchListingById, fetchListings } from '@/services/listingsApi'
import type { SearchParams } from '@/types/search'

export const fetchListingsThunk = createAsyncThunk(
  'listings/fetchList',
  async (params: Partial<SearchParams> = {}, { getState }) => {
    const state = getState() as RootState
    const location = state.user.accountLocation
    const hasOrigin = location != null
    const hasQuery = Boolean(params.query?.trim())

    const sortBy =
      hasQuery && hasOrigin && (params.sortBy == null || params.sortBy === SortBy.Rating)
        ? SortBy.Distance
        : (params.sortBy ?? SortBy.Rating)

    return fetchListings({
      ...params,
      sortBy,
      originLat: location?.lat ?? null,
      originLng: location?.lng ?? null,
    })
  },
)

export const fetchListingByIdThunk = createAsyncThunk(
  'listings/fetchById',
  async (id: string) => fetchListingById(id),
)
