import { useCallback, useEffect, useState } from 'react'
import { fetchMyListings } from '@/services/listingsApi'
import type { Listing } from '@/types/listing'

function useMyListings(userId: string | undefined) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(Boolean(userId))

  const reload = useCallback(async () => {
    if (!userId) {
      setListings([])
      return
    }
    setLoading(true)
    try {
      setListings(await fetchMyListings(userId))
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    let cancelled = false

    fetchMyListings(userId)
      .then((items) => {
        if (!cancelled) setListings(items)
      })
      .catch(() => {
        if (!cancelled) setListings([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { listings, loading, reload }
}

export {
  useMyListings,
}
