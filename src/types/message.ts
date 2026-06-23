type MessageType = 'text' | 'file' | 'voice' | 'listing';

import type { UserRole } from '@/types/user';

type ConversationType = 'dm' | 'group';

interface MessageParticipant {
  id: string;
  name: string;
  login: string;
  avatarUrl?: string;
  role?: UserRole;
  isStaff?: boolean;
}

interface MessagePreview {
  id: string;
  type: MessageType;
  body: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

interface GroupPreview {
  name: string;
  avatarUrl?: string;
  memberCount: number;
}

interface GroupMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: MessageParticipant;
}

interface GroupDetail extends GroupPreview {
  id: string;
  createdById?: string;
  myRole: string;
  members: GroupMember[];
}

interface ConversationSummary {
  id: string;
  type: ConversationType;
  otherUser?: MessageParticipant;
  group?: GroupPreview;
  lastMessage?: MessagePreview;
  unreadCount: number;
  updatedAt: string;
}

interface ListingMessagePreview {
  id: string;
  title: string;
  kind: string;
  priceFrom: number;
  unit: string;
  image?: string;
}

interface ChatMessage {
  id: string;
  type: MessageType;
  body: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMime?: string;
  listingId?: string;
  listingPreview?: ListingMessagePreview;
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  senderIsStaff?: boolean;
  createdAt: string;
  readAt?: string;
  editedAt?: string;
  isDeleted?: boolean;
  isForwarded?: boolean;
  isMine: boolean;
}

interface ConversationDetail {
  id: string;
  type: ConversationType;
  otherUser?: MessageParticipant;
  group?: GroupDetail;
  messages: ChatMessage[];
}

interface SendMessagePayload {
  type?: MessageType;
  body?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMime?: string;
  listingId?: string;
}

export type {
  MessageType,
  ConversationType,
  MessageParticipant,
  MessagePreview,
  GroupPreview,
  GroupMember,
  GroupDetail,
  ConversationSummary,
  ChatMessage,
  ConversationDetail,
  SendMessagePayload,
  ListingMessagePreview,
}
