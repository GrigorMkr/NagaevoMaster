import { useEffect } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { setAccountLocation } from '@/features/user/userSlice'
import { loadStoredAccountLocation } from '@/hooks/useAccountLocation'

export function AccountLocationBootstrap() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const stored = loadStoredAccountLocation()
    if (stored) {
      dispatch(setAccountLocation(stored))
    }
  }, [dispatch])

  return null
}
