import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { SIMILAR_LISTINGS_LIMIT } from '@/constants'
import type { Listing } from '@/types/listing'

const selectListingsState = (state: RootState) => state.listings

export const selectListingsItems = createSelector(
  selectListingsState,
  (listings) => listings.items,
)

export const selectCurrentListing = createSelector(
  selectListingsState,
  (listings) => listings.currentListing,
)

export const selectListingsLoading = createSelector(
  selectListingsState,
  (listings) => listings.isLoading,
)

export const selectListingsError = createSelector(
  selectListingsState,
  (listings) => listings.error,
)

export const selectSimilarListings = (listingId: string, limit = SIMILAR_LISTINGS_LIMIT) =>
  createSelector(selectListingsItems, (items): Listing[] => {
    const current = items.find((item) => item.id === listingId)
    if (!current) {
      return items.filter((item) => item.id !== listingId).slice(0, limit)
    }
    return items
      .filter(
        (item) =>
          item.id !== listingId &&
          (item.category === current.category || item.subcategory === current.subcategory),
      )
      .slice(0, limit)
  })
