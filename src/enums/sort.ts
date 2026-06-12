enum SortBy {
    Rating = 'rating',
    Distance = 'distance',
    PriceAsc = 'price_asc',
    PriceDesc = 'price_desc',
    Newest = 'newest'
}
const SORT_BY_LABELS: Record<SortBy, string> = {
    [SortBy.Rating]: 'По рейтингу',
    [SortBy.Distance]: 'Ближайшие',
    [SortBy.PriceAsc]: 'Цена ↑',
    [SortBy.PriceDesc]: 'Цена ↓',
    [SortBy.Newest]: 'Новые',
};
const SORT_BY_OPTIONS = Object.values(SortBy);

export {
  SortBy,
  SORT_BY_LABELS,
  SORT_BY_OPTIONS,
}
