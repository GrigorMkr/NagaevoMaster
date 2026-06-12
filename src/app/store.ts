import { configureStore } from '@reduxjs/toolkit'
import userReducer from '@/features/user/userSlice'
import listingsReducer from '@/features/listings/listingsSlice'
import filtersReducer from '@/features/filters/filtersSlice'
import forumReducer from '@/features/forum/forumSlice'
import uiReducer from '@/features/ui/uiSlice'
import favoritesReducer from '@/features/favorites/favoritesSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    listings: listingsReducer,
    filters: filtersReducer,
    forum: forumReducer,
    ui: uiReducer,
    favorites: favoritesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
