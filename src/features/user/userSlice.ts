import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types/user'

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.currentUser = action.payload
      state.isAuthenticated = action.payload !== null
      state.error = null
    },
    setUserError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
    logout(state) {
      state.currentUser = null
      state.isAuthenticated = false
      state.error = null
    },
  },
})

export const { setUserLoading, setUser, setUserError, logout } = userSlice.actions
export default userSlice.reducer
