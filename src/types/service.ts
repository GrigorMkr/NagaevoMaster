interface ServiceCategory {
    id: string;
    name: string;
    slug: string;
    icon?: string;
}
interface ServiceProvider {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    rating: number;
    reviewCount: number;
}
interface Service {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    category?: ServiceCategory;
    provider: ServiceProvider;
    price?: number;
    priceUnit?: string;
    location: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}
interface ServiceFilters {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
}

export type {
  ServiceCategory,
  ServiceProvider,
  Service,
  ServiceFilters,
}
