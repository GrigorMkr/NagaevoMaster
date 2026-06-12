export type { User, UserRole } from './user';
export type { Listing, ListingLocation, ListingWithUser, PriceUnit, Review } from './listing';
export type { SearchParams, SortBy, DistanceFilter, RatingFilter } from './search';
export { DEFAULT_SEARCH_PARAMS } from './search';
export type { Service, ServiceCategory, ServiceProvider, ServiceFilters } from './service';
export type { ForumAuthor, ForumTopic, ForumReply } from './forum';
export type { NewsItem, NewsCategory } from './news';
interface ForumPost {
    id: string;
    content: string;
    author: import('./user').User;
    createdAt: string;
    likes: number;
    isLiked: boolean;
}
interface ForumTopicDetail {
    id: string;
    title: string;
    category: string;
    author: import('./user').User;
    postsCount: number;
    lastPostAt: string;
    isPinned: boolean;
    isClosed: boolean;
    posts: ForumPost[];
}

export type {
  ForumPost,
  ForumTopicDetail,
}
