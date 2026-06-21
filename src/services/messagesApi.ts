import { api } from './api';
import type { ChatMessage, ConversationDetail, ConversationSummary, SendMessagePayload } from '@/types/message';

async function fetchConversations(): Promise<ConversationSummary[]> {
  const response = await api.get<ConversationSummary[]>('/messages/conversations');
  return response.data;
}

async function fetchUnreadMessageCount(): Promise<number> {
  const response = await api.get<{ count: number }>('/messages/unread-count');
  return response.data.count;
}

async function startConversation(userId: string): Promise<ConversationSummary> {
  const response = await api.post<ConversationSummary>('/messages/conversations', { userId });
  return response.data;
}

async function fetchConversation(conversationId: string): Promise<ConversationDetail> {
  const response = await api.get<ConversationDetail>(`/messages/conversations/${conversationId}`);
  return response.data;
}

async function sendMessage(conversationId: string, payload: SendMessagePayload | string): Promise<ChatMessage> {
  const body = typeof payload === 'string'
    ? { type: 'text' as const, body: payload }
    : payload;
  const response = await api.post<ChatMessage>(`/messages/conversations/${conversationId}/messages`, {
    type: body.type ?? 'text',
    body: body.body ?? '',
    attachmentUrl: body.attachmentUrl,
    attachmentName: body.attachmentName,
    attachmentMime: body.attachmentMime,
  });
  return response.data;
}

async function markConversationRead(conversationId: string): Promise<void> {
  await api.patch(`/messages/conversations/${conversationId}/read`);
}

export {
  fetchConversations,
  fetchUnreadMessageCount,
  startConversation,
  fetchConversation,
  sendMessage,
  markConversationRead,
}
