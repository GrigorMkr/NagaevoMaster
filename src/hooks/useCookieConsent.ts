import { useCallback, useEffect, useState } from 'react'
import { COOKIE_CONSENT_STORAGE_KEY } from '@/constants/cookie-consent'

export function useCookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    try {
      const isAccepted = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === 'accepted'
      if (!cancelled && !isAccepted) {
        setIsVisible(true)
      }
    } catch {
      if (!cancelled) {
        setIsVisible(true)
      }
    }

    return () => {
      cancelled = true
    }
  }, [])

  const handleAccept = useCallback(() => {
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted')
    } catch {
      // localStorage may be unavailable in private mode
    }
    setIsVisible(false)
  }, [])

  return { isVisible, handleAccept }
}
