interface ForumAuthor {
    id: string;
    name: string;
    avatarUrl?: string;
}
interface ForumTopic {
    id: string;
    title: string;
    content: string;
    author: ForumAuthor;
    category: string;
    replyCount: number;
    viewCount: number;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}
interface ForumReply {
    id: string;
    topicId: string;
    content: string;
    author: ForumAuthor;
    createdAt: string;
}

export type {
  ForumAuthor,
  ForumTopic,
  ForumReply,
}
