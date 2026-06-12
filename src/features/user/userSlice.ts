import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AccountLocation } from '@/types/location';
import type { User } from '@/types/user';
interface UserState {
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    accountLocation: AccountLocation | null;
    isLocating: boolean;
}
const initialState: UserState = {
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    accountLocation: null,
    isLocating: false,
};
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setUser(state, action: PayloadAction<User | null>) {
            state.currentUser = action.payload;
            state.isAuthenticated = action.payload !== null;
            state.error = null;
        },
        setUserError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        logout(state) {
            state.currentUser = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        setAccountLocation(state, action: PayloadAction<AccountLocation | null>) {
            state.accountLocation = action.payload;
            state.isLocating = false;
        },
        setLocating(state, action: PayloadAction<boolean>) {
            state.isLocating = action.payload;
        },
        clearAccountLocation(state) {
            state.accountLocation = null;
            state.isLocating = false;
        },
    },
});
const { setUserLoading, setUser, setUserError, logout, setAccountLocation, setLocating, clearAccountLocation, } = userSlice.actions;

export {
  setUserLoading,
  setUser,
  setUserError,
  logout,
  setAccountLocation,
  setLocating,
  clearAccountLocation,
}

export default userSlice.reducer
