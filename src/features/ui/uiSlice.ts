import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  hasForumNotifications: boolean
  sidebarOpen: boolean
}

const initialState: UiState = {
  hasForumNotifications: false,
  sidebarOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setForumNotifications(state, action: PayloadAction<boolean>) {
      state.hasForumNotifications = action.payload
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload
    },
  },
})

export const { setForumNotifications, setSidebarOpen } = uiSlice.actions
export default uiSlice.reducer
