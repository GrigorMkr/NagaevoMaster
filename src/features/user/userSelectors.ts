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

function selectCanModerate(state: RootState) {
  const role = state.user.currentUser?.role
  return role === 'admin' || role === 'moderator'
}

function selectIsAdmin(state: RootState) {
  return state.user.currentUser?.role === 'admin'
}

export {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectCanModerate,
  selectIsAdmin,
}
