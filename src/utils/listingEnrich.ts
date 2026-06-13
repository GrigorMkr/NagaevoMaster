import { getListingAuthor } from '@/data/mock/listingAuthors';
import { getListingImages } from '@/data/mock/listingImages';
import type { Listing } from '@/types/listing';
import { buildAvatarUrl } from '@/utils/avatarUrl';

function enrichListing(listing: Listing): Listing {
  const images = listing.images.length > 0
    ? listing.images
    : getListingImages(listing.category, listing.subcategory, listing.id);

  const author = listing.author
    ? {
        ...listing.author,
        avatarUrl: listing.author.avatarUrl || buildAvatarUrl(listing.author.name, listing.author.login),
      }
    : getListingAuthor(listing.userId);

  return {
    ...listing,
    images,
    author,
  };
}

function enrichListings(listings: Listing[]): Listing[] {
  return listings.map(enrichListing);
}

export {
  enrichListing,
  enrichListings,
}
