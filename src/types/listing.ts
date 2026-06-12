import type { User } from './user'

export type PriceUnit = 'час' | 'день' | 'м²' | 'услуга' | 'шт'

export interface ListingLocation {
  lat: number
  lng: number
  address: string
}

export interface Listing {
  id: string
  userId: string
  title: string
  category: string
  subcategory: string
  description: string
  priceFrom: number
  priceTo?: number
  unit: PriceUnit
  rating: number
  reviewsCount: number
  images: string[]
  location: ListingLocation
  phone: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  listingId: string
  userId: string
  authorName: string
  rating: number
  text: string
  masterReply?: string
  createdAt: string
}

export interface ListingWithUser extends Listing {
  user?: User
}
