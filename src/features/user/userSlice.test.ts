import { describe, expect, it } from 'vitest'
import userReducer, { logout, setUser, setUserError, setUserLoading } from './userSlice'
import { mockUser } from '@/test/mock-data'

describe('user reducer', () => {
  const initialState = {
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }

  it('returns initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('handles setUserLoading', () => {
    const state = userReducer(initialState, setUserLoading(true))
    expect(state.isLoading).toBe(true)
  })

  it('handles setUser', () => {
    const state = userReducer(initialState, setUser(mockUser))
    expect(state.currentUser).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.error).toBeNull()
  })

  it('handles setUserError', () => {
    const state = userReducer(initialState, setUserError('Ошибка входа'))
    expect(state.error).toBe('Ошибка входа')
  })

  it('handles logout', () => {
    const loggedIn = userReducer(initialState, setUser(mockUser))
    const state = userReducer(loggedIn, logout())
    expect(state.currentUser).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
