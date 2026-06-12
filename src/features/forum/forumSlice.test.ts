import { describe, expect, it } from 'vitest'
import forumReducer, { setError, setLoading, setTopics } from './forumSlice'
import { mockForumTopic } from '@/test/mock-data'

describe('forum reducer', () => {
  const initialState = {
    topics: [],
    loading: false,
    error: null,
  }

  it('returns initial state', () => {
    expect(forumReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('handles setLoading', () => {
    const state = forumReducer(initialState, setLoading(true))
    expect(state.loading).toBe(true)
  })

  it('handles setError', () => {
    const state = forumReducer(initialState, setError('Ошибка форума'))
    expect(state.error).toBe('Ошибка форума')
  })

  it('handles setTopics', () => {
    const state = forumReducer(initialState, setTopics([mockForumTopic]))
    expect(state.topics).toEqual([mockForumTopic])
  })
})
