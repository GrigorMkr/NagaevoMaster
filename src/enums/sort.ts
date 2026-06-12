export enum SortBy {
  Rating = 'rating',
  PriceAsc = 'price_asc',
  PriceDesc = 'price_desc',
  Newest = 'newest',
}

export const SORT_BY_LABELS: Record<SortBy, string> = {
  [SortBy.Rating]: 'По рейтингу',
  [SortBy.PriceAsc]: 'Цена ↑',
  [SortBy.PriceDesc]: 'Цена ↓',
  [SortBy.Newest]: 'Новые',
}

export const SORT_BY_OPTIONS = Object.values(SortBy)
