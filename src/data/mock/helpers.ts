import type { Listing } from '@/types/listing';
function createListing(data: Omit<Listing, 'images'> & {
    images?: string[];
}): Listing {
    return { images: [], ...data };
}

export {
  createListing,
}
