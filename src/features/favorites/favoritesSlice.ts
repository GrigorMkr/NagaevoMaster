import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface FavoritesState {
  ids: string[]
  isLoading: boolean
}

const initialState: FavoritesState = {
  ids: [],
  isLoading: false,
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavoritesLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setFavorites(state, action: PayloadAction<string[]>) {
      state.ids = action.payload
    },
    addFavorite(state, action: PayloadAction<string>) {
      if (!state.ids.includes(action.payload)) {
        state.ids.push(action.payload)
      }
    },
    removeFavorite(state, action: PayloadAction<string>) {
      state.ids = state.ids.filter((id) => id !== action.payload)
    },
  },
})

export const { setFavoritesLoading, setFavorites, addFavorite, removeFavorite } =
  favoritesSlice.actions
export default favoritesSlice.reducer
