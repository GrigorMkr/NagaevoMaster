import type { Listing } from '@/types/listing';
import type { User } from '@/types/user';
import type { ForumTopic } from '@/types';
import { NewsCategory } from '@/enums/news';
const mockListing: Listing = {
    id: 'test-1',
    userId: 'user-1',
    title: 'Ремонт кровли',
    description: 'Качественный ремонт кровли в Нагаево',
    category: 'construction',
    subcategory: 'roof',
    priceFrom: 5000,
    unit: 'м²',
    rating: 4.8,
    reviewsCount: 12,
    images: [],
    phone: '+7 987 654-32-10',
    isVerified: true,
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    location: {
        lat: 54.6247,
        lng: 56.1194,
        address: 'с. Нагаево, ул. Советская, д. 1',
    },
};
const mockUser: User = {
    id: 'user-1',
    name: 'Иван Петров',
    email: 'ivan@example.com',
    phone: '+79876543210',
    role: 'user',
    createdAt: '2025-01-01T00:00:00.000Z',
};
const mockForumTopic: ForumTopic = {
    id: 'topic-1',
    title: 'Вопрос по водоснабжению',
    content: 'Как подключить воду на участке?',
    category: 'utilities',
    author: { id: 'author-1', name: 'Мария' },
    replyCount: 3,
    viewCount: 42,
    isPinned: false,
    createdAt: '2025-02-01T12:00:00.000Z',
    updatedAt: '2025-02-01T12:00:00.000Z',
};
const mockNewsItem = {
    id: 'news-1',
    title: 'Новость Нагаево',
    excerpt: 'Краткое описание новости',
    date: '2025-02-10',
    url: 'https://example.com/news/1',
    category: NewsCategory.Local,
};

export {
  mockListing,
  mockUser,
  mockForumTopic,
  mockNewsItem,
}
