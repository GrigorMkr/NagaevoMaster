import { describe, expect, it } from 'vitest'
import favoritesReducer, {
  addFavorite,
  removeFavorite,
  setFavorites,
  setFavoritesLoading,
} from './favoritesSlice'

describe('favorites reducer', () => {
  const initialState = {
    ids: [],
    isLoading: false,
  }

  it('returns initial state', () => {
    expect(favoritesReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('handles setFavoritesLoading', () => {
    const state = favoritesReducer(initialState, setFavoritesLoading(true))
    expect(state.isLoading).toBe(true)
  })

  it('handles setFavorites', () => {
    const state = favoritesReducer(initialState, setFavorites(['a', 'b']))
    expect(state.ids).toEqual(['a', 'b'])
  })

  it('handles addFavorite', () => {
    const state = favoritesReducer(initialState, addFavorite('listing-1'))
    expect(state.ids).toEqual(['listing-1'])
  })

  it('does not duplicate favorites', () => {
    const withFavorite = favoritesReducer(initialState, addFavorite('listing-1'))
    const state = favoritesReducer(withFavorite, addFavorite('listing-1'))
    expect(state.ids).toEqual(['listing-1'])
  })

  it('handles removeFavorite', () => {
    const withFavorites = favoritesReducer(initialState, setFavorites(['a', 'b']))
    const state = favoritesReducer(withFavorites, removeFavorite('a'))
    expect(state.ids).toEqual(['b'])
  })
})
