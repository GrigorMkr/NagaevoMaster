import { SortBy } from '@/enums/sort';
import type { DistanceFilter as DistanceFilterEnum, RatingFilter as RatingFilterEnum } from '@/enums/filters';
export { SortBy };
type DistanceFilter = DistanceFilterEnum | null;
type RatingFilter = RatingFilterEnum;
interface SearchParams {
    query: string;
    category: string | null;
    subcategory: string | null;
    priceMin: number | null;
    priceMax: number | null;
    rating: RatingFilter;
    distance: DistanceFilter;
    sortBy: SortBy;
    page: number;
    originLat: number | null;
    originLng: number | null;
}
const DEFAULT_SEARCH_PARAMS: SearchParams = {
    query: '',
    category: null,
    subcategory: null,
    priceMin: null,
    priceMax: null,
    rating: 0,
    distance: null,
    sortBy: SortBy.Rating,
    page: 1,
    originLat: null,
    originLng: null,
};

export {
  DEFAULT_SEARCH_PARAMS,
}

export type {
  DistanceFilter,
  RatingFilter,
  SearchParams,
}
