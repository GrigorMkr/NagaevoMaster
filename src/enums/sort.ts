enum SortBy {
    Popular = 'popular',
    Rating = 'rating',
    Distance = 'distance',
    PriceAsc = 'price_asc',
    PriceDesc = 'price_desc',
    Newest = 'newest'
}
const SORT_BY_LABELS: Record<SortBy, string> = {
    [SortBy.Popular]: 'По популярности',
    [SortBy.Rating]: 'По рейтингу',
    [SortBy.Distance]: 'Ближайшие',
    [SortBy.PriceAsc]: 'Цена ↑',
    [SortBy.PriceDesc]: 'Цена ↓',
    [SortBy.Newest]: 'По дате',
};
const SORT_BY_OPTIONS = Object.values(SortBy);
const SERVICE_SORT_OPTIONS = [SortBy.Popular, SortBy.Rating, SortBy.Newest] as const;

export {
  SortBy,
  SORT_BY_LABELS,
  SORT_BY_OPTIONS,
  SERVICE_SORT_OPTIONS,
}
