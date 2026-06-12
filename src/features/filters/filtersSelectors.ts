import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
const selectFiltersState = (state: RootState) => state.filters;
const selectSearchParams = selectFiltersState;
const selectSearchQuery = createSelector(selectFiltersState, (filters) => filters.query);
const selectActiveFiltersCount = createSelector(selectFiltersState, (filters) => {
    let count = 0;
    if (filters.category)
        count += 1;
    if (filters.subcategory)
        count += 1;
    if (filters.priceMin !== null)
        count += 1;
    if (filters.priceMax !== null)
        count += 1;
    if (filters.rating > 0)
        count += 1;
    if (filters.distance !== null)
        count += 1;
    return count;
});

export {
  selectSearchParams,
  selectSearchQuery,
  selectActiveFiltersCount,
}
