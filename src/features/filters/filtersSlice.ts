import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_SEARCH_PARAMS, type SearchParams } from '@/types/search'

const filtersSlice = createSlice({
  name: 'filters',
  initialState: DEFAULT_SEARCH_PARAMS,
  reducers: {
    setSearchParams(state, action: PayloadAction<Partial<SearchParams>>) {
      return { ...state, ...action.payload }
    },
    resetSearchParams() {
      return DEFAULT_SEARCH_PARAMS
    },
  },
})

export const { setSearchParams, resetSearchParams } = filtersSlice.actions
export default filtersSlice.reducer
