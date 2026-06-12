export interface ForumAuthor {
  id: string
  name: string
  avatarUrl?: string
}

export interface ForumTopic {
  id: string
  title: string
  content: string
  author: ForumAuthor
  category: string
  replyCount: number
  viewCount: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface ForumReply {
  id: string
  topicId: string
  content: string
  author: ForumAuthor
  createdAt: string
}
