import { useEffect } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { setUser, setUserError, setUserLoading } from '@/features/user/userSlice'
import { fetchCurrentUser } from '@/services/authApi'
import { fetchFavorites } from '@/services/favoritesApi'
import { setFavorites } from '@/features/favorites/favoritesSlice'

export function AuthBootstrap() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    dispatch(setUserLoading(true))
    fetchCurrentUser()
      .then((user) => {
        dispatch(setUser(user))
        return fetchFavorites()
      })
      .then((ids) => {
        dispatch(setFavorites(ids))
      })
      .catch(() => {
        localStorage.removeItem('token')
        dispatch(setUserError('Сессия истекла'))
      })
      .finally(() => {
        dispatch(setUserLoading(false))
      })
  }, [dispatch])

  return null
}
