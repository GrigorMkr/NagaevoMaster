import type { RootState } from '@/app/store'

function selectCurrentUser(state: RootState) {
  return state.user.currentUser
}

function selectIsAuthenticated(state: RootState) {
  return state.user.isAuthenticated
}

function selectAuthLoading(state: RootState) {
  return state.user.isLoading
}

export {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
}
