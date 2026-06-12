import type { Listing } from '@/types/listing'

export function createListing(
  data: Omit<Listing, 'images'> & { images?: string[] },
): Listing {
  return { images: [], ...data }
}
