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
    listingId: body.listingId,
  });
  return response.data;
}

async function markConversationRead(conversationId: string): Promise<void> {
  await api.patch(`/messages/conversations/${conversationId}/read`);
}

async function editMessage(messageId: string, body: string): Promise<ChatMessage> {
  const response = await api.patch<ChatMessage>(`/messages/items/${messageId}`, { body });
  return response.data;
}

async function deleteMessage(messageId: string): Promise<ChatMessage> {
  const response = await api.delete<ChatMessage>(`/messages/items/${messageId}`);
  return response.data;
}

async function forwardMessage(messageId: string, conversationId: string): Promise<ChatMessage> {
  const response = await api.post<ChatMessage>(`/messages/items/${messageId}/forward`, { conversationId });
  return response.data;
}

export {
  fetchConversations,
  fetchUnreadMessageCount,
  startConversation,
  fetchConversation,
  sendMessage,
  markConversationRead,
  editMessage,
  deleteMessage,
  forwardMessage,
}
