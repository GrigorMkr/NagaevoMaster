import type { User } from './user';

type PriceUnit = 'час' | 'день' | 'м²' | 'услуга' | 'шт';

type ListingStatus = 'pending' | 'published' | 'rejected';

interface ListingLocation {
  lat: number;
  lng: number;
  address: string;
}

interface ListingAuthor {
  id: string;
  name: string;
  login: string;
  avatarUrl: string;
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
  status?: ListingStatus;
  createdAt: string;
  updatedAt: string;
  author?: ListingAuthor;
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
  ListingStatus,
  ListingLocation,
  ListingAuthor,
  Listing,
  Review,
  ListingWithUser,
}
