import { useEffect, useState } from 'react'
import { fetchMyListings } from '@/services/listingsApi'
import type { Listing } from '@/types/listing'

function useMyListings(userId: string | undefined) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(Boolean(userId))

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

  return { listings, loading }
}

export {
  useMyListings,
}
