import { api } from './api'

export interface ForumTopicListItem {
  id: string
  title: string
  category: string
  authorName: string
  postsCount: number
  lastPostAt: string
  isPinned: boolean
}

export interface ForumTopicDetail extends ForumTopicListItem {
  content: string
  isClosed: boolean
  viewCount: number
  createdAt: string
  posts: {
    id: string
    content: string
    authorName: string
    likes: number
    createdAt: string
  }[]
}

export async function fetchForumTopics(category?: string): Promise<ForumTopicListItem[]> {
  const response = await api.get<ForumTopicListItem[]>('/forum/topics', {
    params: category ? { category } : undefined,
  })
  return response.data
}

export async function fetchForumTopic(id: string): Promise<ForumTopicDetail> {
  const response = await api.get<ForumTopicDetail>(`/forum/topics/${id}`)
  return response.data
}

export async function createForumTopic(data: {
  title: string
  content: string
  category: string
}): Promise<ForumTopicListItem> {
  const response = await api.post<ForumTopicListItem>('/forum/topics', data)
  return response.data
}

export async function createForumReply(topicId: string, content: string): Promise<void> {
  await api.post(`/forum/topics/${topicId}/replies`, { content })
}
