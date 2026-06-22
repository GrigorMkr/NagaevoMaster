import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ListingReactionsState {
  byListingId: Record<string, 1 | -1>;
  isLoading: boolean;
}

const initialState: ListingReactionsState = {
  byListingId: {},
  isLoading: false,
};

const listingReactionsSlice = createSlice({
  name: 'listingReactions',
  initialState,
  reducers: {
    setListingReactionsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setListingReactions(state, action: PayloadAction<Record<string, 1 | -1>>) {
      state.byListingId = action.payload;
    },
    setListingReaction(
      state,
      action: PayloadAction<{ listingId: string; value: 1 | -1 | null }>,
    ) {
      const { listingId, value } = action.payload;
      if (value == null) {
        delete state.byListingId[listingId];
      } else {
        state.byListingId[listingId] = value;
      }
    },
    clearListingReactions(state) {
      state.byListingId = {};
    },
  },
});

const {
  setListingReactionsLoading,
  setListingReactions,
  setListingReaction,
  clearListingReactions,
} = listingReactionsSlice.actions;

export {
  setListingReactionsLoading,
  setListingReactions,
  setListingReaction,
  clearListingReactions,
};

export default listingReactionsSlice.reducer;
