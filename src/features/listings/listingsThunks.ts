import { createAsyncThunk } from '@reduxjs/toolkit'
import type { SearchParams } from '@/types/search'
import { fetchListingById, fetchListings } from '@/services/listingsApi'

export const fetchListingsThunk = createAsyncThunk(
  'listings/fetchList',
  async (params: Partial<SearchParams> = {}) => fetchListings(params),
)

export const fetchListingByIdThunk = createAsyncThunk(
  'listings/fetchById',
  async (id: string) => fetchListingById(id),
)
