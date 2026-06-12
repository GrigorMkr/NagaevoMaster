import { USE_MOCK_FALLBACK } from '@/config/runtime';
import { MOCK_FORUM_TOPICS } from '@/data/mockListings';
import { api } from './api';
interface ForumTopicListItem {
    id: string;
    title: string;
    category: string;
    authorName: string;
    postsCount: number;
    lastPostAt: string;
    isPinned: boolean;
}
interface ForumTopicDetail extends ForumTopicListItem {
    content: string;
    isClosed: boolean;
    viewCount: number;
    createdAt: string;
    posts: {
        id: string;
        content: string;
        authorName: string;
        likes: number;
        createdAt: string;
    }[];
}
function mockForumTopics(category?: string): ForumTopicListItem[] {
    return MOCK_FORUM_TOPICS.filter((topic) => !category || topic.category === category).map((topic) => ({
        id: topic.id,
        title: topic.title,
        category: topic.category,
        authorName: topic.authorName,
        postsCount: topic.postsCount,
        lastPostAt: topic.lastPostAt,
        isPinned: topic.isPinned,
    }));
}
function mockForumTopic(id: string): ForumTopicDetail | null {
    const topic = MOCK_FORUM_TOPICS.find((item) => item.id === id);
    if (!topic)
        return null;
    return {
        id: topic.id,
        title: topic.title,
        category: topic.category,
        authorName: topic.authorName,
        postsCount: topic.postsCount,
        lastPostAt: topic.lastPostAt,
        isPinned: topic.isPinned,
        content: `Обсуждение на форуме Нагаево: ${topic.title}`,
        isClosed: false,
        viewCount: 0,
        createdAt: topic.lastPostAt,
        posts: [],
    };
}
async function fetchForumTopics(category?: string): Promise<ForumTopicListItem[]> {
    try {
        const response = await api.get<ForumTopicListItem[]>('/forum/topics', {
            params: category ? { category } : undefined,
        });
        return response.data;
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        return mockForumTopics(category);
    }
}
async function fetchForumTopic(id: string): Promise<ForumTopicDetail> {
    try {
        const response = await api.get<ForumTopicDetail>(`/forum/topics/${id}`);
        return response.data;
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        const topic = mockForumTopic(id);
        if (!topic) {
            throw new Error('Тема не найдена', { cause: error });
        }
        return topic;
    }
}
async function createForumTopic(data: {
    title: string;
    content: string;
    category: string;
}): Promise<ForumTopicListItem> {
    const response = await api.post<ForumTopicListItem>('/forum/topics', data);
    return response.data;
}
async function createForumReply(topicId: string, content: string): Promise<void> {
    await api.post(`/forum/topics/${topicId}/replies`, { content });
}

export {
  fetchForumTopics,
  fetchForumTopic,
  createForumTopic,
  createForumReply,
}

export type {
  ForumTopicListItem,
  ForumTopicDetail,
}
