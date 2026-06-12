import { describe, expect, it } from 'vitest'
import uiReducer, { setForumNotifications, setSidebarOpen } from './uiSlice'

describe('ui reducer', () => {
  const initialState = {
    hasForumNotifications: false,
    sidebarOpen: false,
  }

  it('returns initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('handles setForumNotifications', () => {
    const state = uiReducer(initialState, setForumNotifications(true))
    expect(state.hasForumNotifications).toBe(true)
  })

  it('handles setSidebarOpen', () => {
    const state = uiReducer(initialState, setSidebarOpen(true))
    expect(state.sidebarOpen).toBe(true)
  })
})
