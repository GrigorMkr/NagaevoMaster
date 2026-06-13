import { useEffect, useState } from 'react'
import { fetchListingReviews } from '@/services/reviewsApi'
import type { Review } from '@/types/listing'

function useListingReviews(listingId: string, enabled: boolean) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    let cancelled = false

    fetchListingReviews(listingId)
      .then((items) => {
        if (!cancelled) setReviews(items)
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, listingId])

  return { reviews, setReviews, loading }
}

export {
  useListingReviews,
}
