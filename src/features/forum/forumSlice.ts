import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ForumTopic } from '@/types';
interface ForumState {
    topics: ForumTopic[];
    loading: boolean;
    error: string | null;
}
const initialState: ForumState = {
    topics: [],
    loading: false,
    error: null,
};
const forumSlice = createSlice({
    name: 'forum',
    initialState,
    reducers: {
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        setTopics(state, action: PayloadAction<ForumTopic[]>) {
            state.topics = action.payload;
        },
    },
});
const { setLoading, setError, setTopics } = forumSlice.actions;

export {
  setLoading,
  setError,
  setTopics,
}

export default forumSlice.reducer
