import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Listing } from '@/types/listing'
import { fetchListingByIdThunk, fetchListingsThunk } from './listingsThunks'

interface ListingsState {
  items: Listing[]
  currentListing: Listing | null
  isLoading: boolean
  totalPages: number
  currentPage: number
  error: string | null
}

const initialState: ListingsState = {
  items: [],
  currentListing: null,
  isLoading: false,
  totalPages: 1,
  currentPage: 1,
  error: null,
}

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListingsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setListings(state, action: PayloadAction<Listing[]>) {
      state.items = Array.isArray(action.payload) ? action.payload : []
      state.error = null
    },
    setCurrentListing(state, action: PayloadAction<Listing | null>) {
      state.currentListing = action.payload
    },
    setListingsPage(state, action: PayloadAction<{ page: number; totalPages: number }>) {
      state.currentPage = action.payload.page
      state.totalPages = action.payload.totalPages
    },
    setListingsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListingsThunk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchListingsThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload.items
        state.currentPage = action.payload.page
        state.totalPages = action.payload.totalPages
      })
      .addCase(fetchListingsThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Не удалось загрузить объявления'
      })
      .addCase(fetchListingByIdThunk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchListingByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentListing = action.payload
      })
      .addCase(fetchListingByIdThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Объявление не найдено'
        state.currentListing = null
      })
  },
})

export const {
  setListingsLoading,
  setListings,
  setCurrentListing,
  setListingsPage,
  setListingsError,
} = listingsSlice.actions
export default listingsSlice.reducer
