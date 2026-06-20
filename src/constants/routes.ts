const ROUTES = {
    HOME: '/',
    SERVICES: '/services',
    SERVICES_CATEGORY: '/services/:category',
    SERVICES_BEAUTY_SUB: '/services/beauty/:subcategory',
    SERVICE_DETAIL: '/service/:id',
    FORUM: '/forum',
    FORUM_CATEGORY: '/forum/:category',
    FORUM_TOPIC: '/forum/topic/:id',
    NEWS: '/news',
    ADD_LISTING: '/add-listing',
    SEARCH: '/search',
    PROFILE: '/profile',
    AUTH: '/auth',
    ABOUT: '/about',
    CONTACT: '/contact',
} as const;
function serviceDetailPath(id: string): string {
    return `/service/${id}`;
}
function servicesCategoryPath(category: string): string {
    return `/services/${category}`;
}
function servicesBeautyPath(subcategory: string): string {
    return `/services/beauty/${subcategory}`;
}
function forumCategoryPath(category: string): string {
    return `/forum/${category}`;
}
function forumTopicPath(id: string): string {
    return `/forum/topic/${id}`;
}
function searchPath(query?: string, filters?: {
    category?: string;
    subcategory?: string;
    sortBy?: string;
    distance?: number;
}): string {
    const params = new URLSearchParams();
    if (query)
        params.set('query', query);
    if (filters?.category)
        params.set('category', filters.category);
    if (filters?.subcategory)
        params.set('subcategory', filters.subcategory);
    if (filters?.sortBy)
        params.set('sortBy', filters.sortBy);
    if (filters?.distance != null)
        params.set('distance', String(filters.distance));
    const qs = params.toString();
    return qs ? `${ROUTES.SEARCH}?${qs}` : ROUTES.SEARCH;
}

export {
  ROUTES,
  serviceDetailPath,
  servicesCategoryPath,
  servicesBeautyPath,
  forumCategoryPath,
  forumTopicPath,
  searchPath,
}
