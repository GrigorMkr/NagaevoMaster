import { describe, expect, it } from 'vitest'
import listingsReducer, {
  setCurrentListing,
  setListings,
  setListingsError,
  setListingsLoading,
  setListingsPage,
} from './listingsSlice'
import { fetchListingByIdThunk, fetchListingsThunk } from './listingsThunks'
import { mockListing } from '@/test/mock-data'

describe('listings reducer', () => {
  const initialState = {
    items: [],
    currentListing: null,
    isLoading: false,
    totalPages: 1,
    currentPage: 1,
    error: null,
  }

  it('returns initial state', () => {
    expect(listingsReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('handles setListingsLoading', () => {
    const state = listingsReducer(initialState, setListingsLoading(true))
    expect(state.isLoading).toBe(true)
  })

  it('handles setListings', () => {
    const state = listingsReducer(initialState, setListings([mockListing]))
    expect(state.items).toEqual([mockListing])
    expect(state.error).toBeNull()
  })

  it('handles setCurrentListing', () => {
    const state = listingsReducer(initialState, setCurrentListing(mockListing))
    expect(state.currentListing).toEqual(mockListing)
  })

  it('handles setListingsPage', () => {
    const state = listingsReducer(initialState, setListingsPage({ page: 2, totalPages: 5 }))
    expect(state.currentPage).toBe(2)
    expect(state.totalPages).toBe(5)
  })

  it('handles setListingsError', () => {
    const state = listingsReducer(initialState, setListingsError('Ошибка'))
    expect(state.error).toBe('Ошибка')
  })

  it('handles fetchListingsThunk.pending', () => {
    const state = listingsReducer(initialState, { type: fetchListingsThunk.pending.type })
    expect(state.isLoading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('handles fetchListingsThunk.fulfilled', () => {
    const state = listingsReducer(initialState, {
      type: fetchListingsThunk.fulfilled.type,
      payload: { items: [mockListing], page: 1, totalPages: 1 },
    })
    expect(state.isLoading).toBe(false)
    expect(state.items).toEqual([mockListing])
  })

  it('handles fetchListingsThunk.rejected', () => {
    const state = listingsReducer(initialState, {
      type: fetchListingsThunk.rejected.type,
      error: { message: 'Network error' },
    })
    expect(state.isLoading).toBe(false)
    expect(state.error).toBe('Network error')
  })

  it('handles fetchListingByIdThunk.fulfilled', () => {
    const state = listingsReducer(initialState, {
      type: fetchListingByIdThunk.fulfilled.type,
      payload: mockListing,
    })
    expect(state.currentListing).toEqual(mockListing)
    expect(state.isLoading).toBe(false)
  })
})
