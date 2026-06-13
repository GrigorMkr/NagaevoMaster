import type { Listing, Review, User } from '@prisma/client';

function parseImages(images: string): string[] {
    try {
        const parsed = JSON.parse(images) as unknown;
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    }
    catch {
        return [];
    }
}

function toListingAuthor(user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>) {
    const login = user.email.split('@')[0]?.replace(/\./g, '_') ?? user.id;
    return {
        id: user.id,
        name: user.name,
        login,
        avatarUrl: user.avatarUrl ?? undefined,
    };
}

function toUserResponse(user: User) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
    };
}
function toListingResponse(listing: Listing, user?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>) {
    return {
        id: listing.id,
        userId: listing.userId,
        title: listing.title,
        category: listing.category,
        subcategory: listing.subcategory,
        description: listing.description,
        priceFrom: listing.priceFrom,
        priceTo: listing.priceTo ?? undefined,
        unit: listing.unit,
        rating: listing.rating,
        reviewsCount: listing.reviewsCount,
        images: parseImages(listing.images),
        location: {
            lat: listing.lat,
            lng: listing.lng,
            address: listing.address,
        },
        phone: listing.phone,
        isVerified: listing.isVerified,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        author: user ? toListingAuthor(user) : undefined,
    };
}
function toReviewResponse(review: Review & {
    user: Pick<User, 'name'>;
}) {
    return {
        id: review.id,
        listingId: review.listingId,
        userId: review.userId,
        authorName: review.user.name,
        rating: review.rating,
        text: review.text,
        masterReply: review.masterReply ?? undefined,
        createdAt: review.createdAt.toISOString(),
    };
}

export {
  parseImages,
  toUserResponse,
  toListingResponse,
  toListingAuthor,
  toReviewResponse,
}
