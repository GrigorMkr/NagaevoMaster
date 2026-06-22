import { configureStore } from '@reduxjs/toolkit';
import userReducer from '@/features/user/userSlice';
import listingsReducer from '@/features/listings/listingsSlice';
import filtersReducer from '@/features/filters/filtersSlice';
import forumReducer from '@/features/forum/forumSlice';
import uiReducer from '@/features/ui/uiSlice';
import favoritesReducer from '@/features/favorites/favoritesSlice';
import listingReactionsReducer from '@/features/listingReactions/listingReactionsSlice';
const store = configureStore({
    reducer: {
        user: userReducer,
        listings: listingsReducer,
        filters: filtersReducer,
        forum: forumReducer,
        ui: uiReducer,
        favorites: favoritesReducer,
        listingReactions: listingReactionsReducer,
    },
});
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export {
  store,
}

export type {
  RootState,
  AppDispatch,
}
