import { useEffect, useRef } from 'react';
import type { ChatMessage, ConversationSummary } from '@/types/message';
import {
  fetchConversation,
  fetchConversations,
  fetchUnreadMessageCount,
  markConversationRead,
} from '@/services/messagesApi';
import { showMessageLightning } from '@/utils/messageLightningToast';
import { playMessageSound } from '@/utils/messageSound';
import { showMessageNotification } from '@/utils/messageNotification';
import { isOutgoingMessage, pruneOutgoingMessages } from '@/utils/outgoingMessages';
import { tryClaimMessageNotice } from '@/utils/messageNotice';
import { isIosDevice } from '@/utils/pushEnvironment';

const POLL_VISIBLE_MS = 2000;
const POLL_HIDDEN_MS = 1000;
const POLL_VISIBLE_IOS_MS = 1200;
const POLL_HIDDEN_IOS_MS = 700;

interface NewMessageNotice {
  senderName: string;
  preview: string;
  avatarUrl?: string;
  conversationId?: string;
}

interface UseChatLiveSyncOptions {
  activeConversationId: string | null;
  currentUserId?: string | null;
  enabled?: boolean;
  enableSounds?: boolean;
  onMessages: (messages: ChatMessage[]) => void;
  onConversations: (items: ConversationSummary[]) => void;
  onUnreadChange?: (count: number) => void;
  notifySenderName?: string;
  onNewMessage?: (notice: NewMessageNotice) => void;
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return current;
  if (current.length === incoming.length && current.at(-1)?.id === incoming.at(-1)?.id) {
    return current;
  }
  return incoming;
}

function conversationDisplayName(item: ConversationSummary): string {
  if (item.type === 'group' && item.group) return item.group.name;
  return item.otherUser?.name ?? 'Чат';
}

function conversationAvatarUrl(item: ConversationSummary): string | undefined {
  if (item.type === 'group' && item.group) return item.group.avatarUrl;
  return item.otherUser?.avatarUrl;
}

function formatPreview(message: ChatMessage): string {
  if (message.body) return message.body;
  if (message.type === 'voice') return '🎤 Голосовое';
  return '📎 Вложение';
}

function notifyIncomingMessage(senderName: string, preview: string, messageId?: string) {
  void showMessageNotification(senderName, preview, { messageId });
}

function fireNotice(
  notice: NewMessageNotice,
  enableSounds: boolean,
  onNewMessage?: (payload: NewMessageNotice) => void,
) {
  if (enableSounds) {
    void playMessageSound();
  }
  onNewMessage?.(notice);
  showMessageLightning(notice);
}

function shouldNotifyMessage(
  messageId: string,
  senderId: string,
  currentUserId: string | null | undefined,
): boolean {
  if (isOutgoingMessage(messageId)) return false;
  if (currentUserId && senderId === currentUserId) return false;
  return tryClaimMessageNotice(messageId);
}

function useChatLiveSync({
  activeConversationId,
  currentUserId = null,
  enabled = true,
  enableSounds = true,
  onMessages,
  onConversations,
  onUnreadChange,
  notifySenderName,
  onNewMessage,
}: UseChatLiveSyncOptions) {
  const lastMessageIdRef = useRef<string | null>(null);
  const prevUnreadRef = useRef(0);
  const conversationsRef = useRef<ConversationSummary[]>([]);
  const notifyNameRef = useRef(notifySenderName);
  const onNewMessageRef = useRef(onNewMessage);
  const timerRef = useRef<number | null>(null);
  const enableSoundsRef = useRef(enableSounds);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    lastMessageIdRef.current = null;
  }, [activeConversationId]);

  useEffect(() => {
    notifyNameRef.current = notifySenderName;
    onNewMessageRef.current = onNewMessage;
    enableSoundsRef.current = enableSounds;
    currentUserIdRef.current = currentUserId;
  }, [notifySenderName, onNewMessage, enableSounds, currentUserId]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const tabHidden = document.visibilityState === 'hidden';
      pruneOutgoingMessages();

      try {
        const [conversations, unread] = await Promise.all([
          fetchConversations(),
          fetchUnreadMessageCount(),
        ]);
        if (cancelled) return;

        const prevConversations = conversationsRef.current;
        const soundsOn = enableSoundsRef.current;
        const userId = currentUserIdRef.current;

        if (prevConversations.length > 0 && unread > prevUnreadRef.current) {
          const bumped = conversations.find((item) => {
            const prev = prevConversations.find((p) => p.id === item.id);
            return item.unreadCount > 0 && (prev?.unreadCount ?? 0) < item.unreadCount;
          });

          const bumpedMessageId = bumped?.lastMessage?.id;
          const bumpedSenderId = bumped?.lastMessage?.senderId;
          const skipActiveChat = bumped?.id === activeConversationId && !tabHidden;

          if (
            bumped
            && bumpedMessageId
            && bumpedSenderId
            && !skipActiveChat
            && shouldNotifyMessage(bumpedMessageId, bumpedSenderId, userId)
          ) {
            const preview = bumped.lastMessage?.body ?? 'Новое сообщение';
            const displayName = conversationDisplayName(bumped);
            const avatarUrl = conversationAvatarUrl(bumped);
            if (tabHidden) {
              notifyIncomingMessage(displayName, preview, bumpedMessageId);
            } else {
              fireNotice(
                {
                  senderName: displayName,
                  preview,
                  avatarUrl,
                  conversationId: bumped.id,
                },
                soundsOn,
                onNewMessageRef.current,
              );
            }
          }
        }

        prevUnreadRef.current = unread;
        conversationsRef.current = conversations;
        onConversations(conversations);
        onUnreadChange?.(unread);

        if (activeConversationId) {
          const detail = await fetchConversation(activeConversationId);
          if (cancelled) return;

          const lastIncoming = detail.messages.at(-1);
          const hadMessages = lastMessageIdRef.current !== null;
          const isNewFromOther = Boolean(
            lastIncoming
            && !lastIncoming.isMine
            && lastIncoming.id !== lastMessageIdRef.current,
          );

          if (isNewFromOther && hadMessages && lastIncoming) {
            if (shouldNotifyMessage(lastIncoming.id, lastIncoming.senderId, userId)) {
              const preview = formatPreview(lastIncoming);
              const isGroup = detail.type === 'group';
              const senderName = isGroup
                ? `${notifyNameRef.current ?? detail.group?.name ?? 'Группа'}: ${lastIncoming.senderName}`
                : (notifyNameRef.current ?? detail.otherUser?.name ?? 'Чат');
              const avatarUrl = isGroup ? detail.group?.avatarUrl : detail.otherUser?.avatarUrl;
              if (tabHidden) {
                notifyIncomingMessage(senderName, preview, lastIncoming.id);
              } else {
                fireNotice(
                  {
                    senderName,
                    preview,
                    avatarUrl,
                    conversationId: activeConversationId,
                  },
                  soundsOn,
                  onNewMessageRef.current,
                );
                void markConversationRead(activeConversationId);
              }
            } else if (!tabHidden) {
              void markConversationRead(activeConversationId);
            }
          } else if (!tabHidden && isNewFromOther) {
            void markConversationRead(activeConversationId);
          }

          if (lastIncoming) {
            lastMessageIdRef.current = lastIncoming.id;
          }

          onMessages(detail.messages);
        }
      } catch {
        // silent retry on next tick
      }
    };

    const schedule = () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      const ios = isIosDevice();
      const hiddenInterval = ios ? POLL_HIDDEN_IOS_MS : POLL_HIDDEN_MS;
      const visibleInterval = ios ? POLL_VISIBLE_IOS_MS : POLL_VISIBLE_MS;
      const interval = document.visibilityState === 'hidden' ? hiddenInterval : visibleInterval;
      timerRef.current = window.setInterval(() => void tick(), interval);
    };

    void tick();
    schedule();

    const onVisibility = () => {
      void tick();
      schedule();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      cancelled = true;
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [activeConversationId, enabled, onConversations, onMessages, onUnreadChange]);
}

export {
  useChatLiveSync,
  mergeMessages,
};

export type {
  NewMessageNotice,
};
