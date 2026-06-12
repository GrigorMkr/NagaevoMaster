export interface ServiceCategory {
  id: string
  name: string
  slug: string
  icon?: string
}

export interface ServiceProvider {
  id: string
  name: string
  phone?: string
  email?: string
  rating: number
  reviewCount: number
}

export interface Service {
  id: string
  title: string
  description: string
  categoryId: string
  category?: ServiceCategory
  provider: ServiceProvider
  price?: number
  priceUnit?: string
  location: string
  latitude?: number
  longitude?: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ServiceFilters {
  categoryId?: string
  search?: string
  minPrice?: number
  maxPrice?: number
}
