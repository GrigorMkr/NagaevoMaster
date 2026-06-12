import type { User } from './user';
type PriceUnit = 'час' | 'день' | 'м²' | 'услуга' | 'шт';
interface ListingLocation {
    lat: number;
    lng: number;
    address: string;
}
interface Listing {
    id: string;
    userId: string;
    title: string;
    category: string;
    subcategory: string;
    description: string;
    priceFrom: number;
    priceTo?: number;
    unit: PriceUnit;
    rating: number;
    reviewsCount: number;
    images: string[];
    location: ListingLocation;
    phone: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}
interface Review {
    id: string;
    listingId: string;
    userId: string;
    authorName: string;
    rating: number;
    text: string;
    masterReply?: string;
    createdAt: string;
}
interface ListingWithUser extends Listing {
    user?: User;
}

export type {
  PriceUnit,
  ListingLocation,
  Listing,
  Review,
  ListingWithUser,
}
