export const ROUTES = {
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
} as const

export function serviceDetailPath(id: string): string {
  return `/service/${id}`
}

export function servicesCategoryPath(category: string): string {
  return `/services/${category}`
}

export function servicesBeautyPath(subcategory: string): string {
  return `/services/beauty/${subcategory}`
}

export function forumCategoryPath(category: string): string {
  return `/forum/${category}`
}

export function forumTopicPath(id: string): string {
  return `/forum/topic/${id}`
}

export function searchPath(
  query?: string,
  filters?: { category?: string; subcategory?: string },
): string {
  const params = new URLSearchParams()
  if (query) params.set('query', query)
  if (filters?.category) params.set('category', filters.category)
  if (filters?.subcategory) params.set('subcategory', filters.subcategory)
  const qs = params.toString()
  return qs ? `${ROUTES.SEARCH}?${qs}` : ROUTES.SEARCH
}
