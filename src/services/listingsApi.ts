import type { Listing } from '@/types/listing'
import type { SearchParams } from '@/types/search'
import { NAGAEVO_CENTER } from '@/constants/geo-data'
import { MOCK_LISTINGS } from '@/data/mockListings'
import { SortBy } from '@/enums/sort'
import { api } from './api'

const EARTH_RADIUS_KM = 6371

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface ListingsResponse {
  items: Listing[]
  totalPages: number
  page: number
}

function filterMockListings(params: Partial<SearchParams>): Listing[] {
  let result = [...MOCK_LISTINGS]

  if (params.query) {
    const q = params.query.toLowerCase()
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.subcategory.toLowerCase().includes(q),
    )
  }

  if (params.category) {
    result = result.filter((l) => l.category === params.category)
  }

  if (params.subcategory) {
    result = result.filter((l) => l.subcategory === params.subcategory)
  }

  if (params.rating && params.rating > 0) {
    result = result.filter((listing) => listing.rating >= params.rating!)
  }

  if (params.priceMin !== null && params.priceMin !== undefined) {
    result = result.filter((listing) => listing.priceFrom >= params.priceMin!)
  }

  if (params.priceMax !== null && params.priceMax !== undefined) {
    result = result.filter((listing) => listing.priceFrom <= params.priceMax!)
  }

  if (params.distance) {
    result = result.filter(
      (listing) =>
        getDistanceKm(
          NAGAEVO_CENTER.lat,
          NAGAEVO_CENTER.lng,
          listing.location.lat,
          listing.location.lng,
        ) <= params.distance!,
    )
  }

  if (params.sortBy === SortBy.PriceAsc) {
    result.sort((a, b) => a.priceFrom - b.priceFrom)
  } else if (params.sortBy === SortBy.PriceDesc) {
    result.sort((a, b) => b.priceFrom - a.priceFrom)
  } else if (params.sortBy === SortBy.Newest) {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else {
    result.sort((a, b) => b.rating - a.rating)
  }

  return result
}

function isListingsResponse(data: unknown): data is ListingsResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as ListingsResponse).items)
  )
}

function mockListingsResponse(params: Partial<SearchParams>): ListingsResponse {
  return {
    items: filterMockListings(params),
    totalPages: 1,
    page: params.page ?? 1,
  }
}

export async function fetchListings(params: Partial<SearchParams> = {}): Promise<ListingsResponse> {
  try {
    const response = await api.get<ListingsResponse>('/listings', { params })
    if (!isListingsResponse(response.data)) {
      throw new Error('Invalid listings response')
    }
    return response.data
  } catch {
    return mockListingsResponse(params)
  }
}

export async function fetchListingById(id: string): Promise<Listing | null> {
  try {
    const response = await api.get<Listing>(`/listings/${id}`)
    const listing = response.data
    if (!listing || typeof listing !== 'object' || !('id' in listing)) {
      throw new Error('Invalid listing response')
    }
    return listing
  } catch {
    return MOCK_LISTINGS.find((l) => l.id === id) ?? null
  }
}
