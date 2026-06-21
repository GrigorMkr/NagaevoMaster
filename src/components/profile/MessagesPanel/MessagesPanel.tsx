import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import classNames from 'classnames';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { MessageBubble } from '@/components/messages/MessageBubble/MessageBubble';
import {
  fetchConversation,
  fetchConversations,
  fetchUnreadMessageCount,
  markConversationRead,
  sendMessage,
  startConversation,
} from '@/services/messagesApi';
import { blockUser, fetchBlockStatus, unblockUser } from '@/services/blocksApi';
import { uploadMessageAttachment } from '@/services/uploadsApi';
import type { ChatMessage, ConversationSummary } from '@/types/message';
import { EmojiPicker } from '@/components/messages/EmojiPicker/EmojiPicker';
import { PushEnableBanner } from '@/components/push/PushEnableBanner/PushEnableBanner';
import { useChatLiveSync, mergeMessages } from '@/hooks/useChatLiveSync';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { getErrorMessage } from '@/utils/errorMessage';
import { StaffBadge } from '@/components/ui/StaffBadge/StaffBadge';
import { ensurePushNotifications } from '@/services/pushApi';
import { unlockMessageSound } from '@/utils/messageSound';
import { registerOutgoingMessage } from '@/utils/outgoingMessages';
import { canAttemptPushSubscribe } from '@/utils/pushEnvironment';
import styles from './MessagesPanel.module.css';

interface MessagesPanelProps {
  chatId: string | null;
  withUserId: string | null;
  onChatChange: (chatId: string | null) => void;
  onUnreadChange?: (count: number) => void;
}

function MessagesPanel({ chatId, withUserId, onChatChange, onUnreadChange }: MessagesPanelProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const composeBarRef = useRef<HTMLFormElement>(null);
  const {
    isRecording,
    seconds: recordingSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const activeId = chatId ?? activeConversation?.id;

  const refreshUnread = useCallback(async () => {
    try {
      const count = await fetchUnreadMessageCount();
      onUnreadChange?.(count);
    } catch {
      onUnreadChange?.(0);
    }
  }, [onUnreadChange]);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      setConversations(await fetchConversations());
      await refreshUnread();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить переписки'));
      setConversations([]);
    } finally {
      setLoadingList(false);
    }
  }, [refreshUnread]);

  const openConversation = useCallback(async (id: string) => {
    setLoadingChat(true);
    try {
      const detail = await fetchConversation(id);
      setMessages(detail.messages);
      setActiveConversation({
        id: detail.id,
        otherUser: detail.otherUser,
        unreadCount: 0,
        updatedAt: detail.messages.at(-1)?.createdAt ?? new Date().toISOString(),
      });
      await markConversationRead(id);
      void loadConversations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось открыть переписку'));
    } finally {
      setLoadingChat(false);
    }
  }, [loadConversations]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    unlockMessageSound();
    if (!canAttemptPushSubscribe()) return;
    void ensurePushNotifications();
  }, []);

  useEffect(() => {
    if (!withUserId || chatId) return;
    let cancelled = false;
    void startConversation(withUserId)
      .then((conversation) => {
        if (cancelled) return;
        onChatChange(conversation.id);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(getErrorMessage(error, 'Не удалось начать переписку'));
        onChatChange(null);
      });
    return () => {
      cancelled = true;
    };
  }, [chatId, onChatChange, withUserId]);

  const scrollChatToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    requestAnimationFrame(() => {
      const list = messageListRef.current;
      if (!list) return;
      list.scrollTo({ top: list.scrollHeight, behavior });
    });
  }, []);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      if (!withUserId) {
        setActiveConversation(null);
      }
      return;
    }
    void openConversation(chatId);
  }, [chatId, openConversation, withUserId]);

  useEffect(() => {
    scrollChatToBottom('smooth');
  }, [messages, scrollChatToBottom]);

  const handleLiveMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => mergeMessages(current, incoming));
  }, []);

  const handleLiveConversations = useCallback((items: ConversationSummary[]) => {
    setConversations(items);
    setActiveConversation((current) => {
      if (!current) return current;
      const updated = items.find((item) => item.id === current.id);
      return updated ? { ...current, ...updated, otherUser: current.otherUser } : current;
    });
  }, []);

  useChatLiveSync({
    activeConversationId: activeId ?? null,
    enabled: true,
    enableSounds: false,
    onMessages: handleLiveMessages,
    onConversations: handleLiveConversations,
    onUnreadChange,
    notifySenderName: activeConversation?.otherUser.name,
  });

  const insertEmoji = (emoji: string) => {
    setDraft((current) => `${current}${emoji}`);
    draftRef.current?.focus();
  };

  const layoutMode = useMemo(() => (activeId ? 'chat' : 'list'), [activeId]);
  const isMobileChat = layoutMode === 'chat' && Boolean(activeId);

  useEffect(() => {
    if (!isMobileChat) return undefined;
    document.documentElement.classList.add('mobile-chat-open');
    document.body.classList.add('mobile-chat-open');
    return () => {
      document.documentElement.classList.remove('mobile-chat-open');
      document.body.classList.remove('mobile-chat-open');
    };
  }, [isMobileChat]);

  const handleDraftFocus = useCallback(() => {
    unlockMessageSound();
    scrollChatToBottom('auto');
    window.scrollTo(0, 0);
  }, [scrollChatToBottom]);

  const submitDraft = useCallback(async () => {
    const body = draft.trim();
    if (!body || !activeId || sending || uploading || isRecording) return;
    setSending(true);
    try {
      const message = await sendMessage(activeId, body);
      registerOutgoingMessage(message.id);
      setMessages((current) => [...current, message]);
      setDraft('');
      if (draftRef.current) {
        draftRef.current.style.height = '';
      }
      scrollChatToBottom('auto');
      void loadConversations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить сообщение'));
    } finally {
      setSending(false);
    }
  }, [activeId, draft, isRecording, loadConversations, scrollChatToBottom, sending, uploading]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    void submitDraft();
  };

  const handleSendAttachment = async (file: File) => {
    if (!activeId) return;
    setUploading(true);
    try {
      const uploaded = await uploadMessageAttachment(file);
      const message = await sendMessage(activeId, {
        type: uploaded.kind,
        attachmentUrl: uploaded.url,
        attachmentName: uploaded.name,
        attachmentMime: uploaded.mimeType,
        body: draft.trim(),
      });
      registerOutgoingMessage(message.id);
      setMessages((current) => [...current, message]);
      setDraft('');
      scrollChatToBottom('auto');
      void loadConversations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить файл'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      void handleSendAttachment(file);
    }
  };

  const handleVoiceToggle = async () => {
    if (!activeId) return;
    if (isRecording) {
      setUploading(true);
      try {
        const file = await stopRecording();
        if (!file) {
          toast.error('Запись пуста');
          return;
        }
        const uploaded = await uploadMessageAttachment(file);
        const message = await sendMessage(activeId, {
          type: 'voice',
          attachmentUrl: uploaded.url,
          attachmentName: uploaded.name,
          attachmentMime: uploaded.mimeType,
        });
        registerOutgoingMessage(message.id);
        setMessages((current) => [...current, message]);
        scrollChatToBottom('auto');
        void loadConversations();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Не удалось отправить голосовое'));
      } finally {
        setUploading(false);
      }
      return;
    }

    try {
      await startRecording();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Разрешите доступ к микрофону в браузере'));
    }
  };

  const resizeDraftField = useCallback((target: HTMLTextAreaElement) => {
    const minHeight = 24;
    target.style.height = `${minHeight}px`;
    target.style.height = `${Math.min(Math.max(target.scrollHeight, minHeight), 120)}px`;
  }, []);

  const handleDraftInput = (event: FormEvent<HTMLTextAreaElement>) => {
    resizeDraftField(event.currentTarget);
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    void submitDraft();
  };

  const otherUser = activeConversation?.otherUser;
  const otherUserId = otherUser?.id;

  useEffect(() => {
    if (!otherUserId) {
      setBlockedByMe(false);
      return;
    }
    void fetchBlockStatus(otherUserId)
      .then((status) => setBlockedByMe(status.blockedByMe))
      .catch(() => setBlockedByMe(false));
  }, [otherUserId]);

  const handleBlockToggle = async () => {
    if (!otherUserId) return;
    setBlockLoading(true);
    try {
      if (blockedByMe) {
        await unblockUser(otherUserId);
        setBlockedByMe(false);
        toast.success('Пользователь разблокирован');
      } else {
        await blockUser(otherUserId);
        setBlockedByMe(true);
        toast.success('Пользователь заблокирован');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось изменить блокировку'));
    } finally {
      setBlockLoading(false);
    }
  };

  const otherAvatar = otherUser
    ? resolveAuthorAvatar(otherUser.name, otherUser.login, otherUser.avatarUrl)
    : undefined;

  const canSend = Boolean(draft.trim()) && !sending && !uploading && !isRecording;

  return (
    <div
      className={classNames(
        styles.messagesLayout,
        layoutMode === 'chat' ? styles.mobileOnlyChat : styles.mobileOnlyList,
        isMobileChat && styles.mobileFullscreen,
      )}
    >
      <aside className={styles.sidebar}>
        <PushEnableBanner compact />
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Чаты</h3>
        </div>
        {loadingList ? (
          <p className={styles.emptySidebar}>Загрузка…</p>
        ) : conversations.length === 0 ? (
          <p className={styles.emptySidebar}>
            Переписок пока нет. Напишите мастеру со страницы объявления или другу из списка друзей.
          </p>
        ) : (
          <ul className={styles.conversationList}>
            {conversations.map((item) => {
              const avatar = resolveAuthorAvatar(
                item.otherUser.name,
                item.otherUser.login,
                item.otherUser.avatarUrl,
              );
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={classNames(
                      styles.conversationItem,
                      activeId === item.id && styles.conversationItemActive,
                    )}
                    onClick={() => onChatChange(item.id)}
                  >
                    <UserAvatar name={item.otherUser.name} src={avatar} size="sm" />
                    <div className={styles.conversationBody}>
                      <p className={styles.conversationName}>
                        <span className={styles.conversationNameText}>{item.otherUser.name}</span>
                        {item.otherUser.isStaff && item.otherUser.role && (
                          <StaffBadge role={item.otherUser.role} compact />
                        )}
                      </p>
                      <p className={styles.conversationPreview}>
                        {item.lastMessage?.body ?? 'Начните диалог'}
                      </p>
                    </div>
                    {item.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>{item.unreadCount}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className={styles.chatPanel}>
        {!activeId || !otherUser ? (
          <div className={styles.chatPlaceholder}>
            Выберите диалог или откройте переписку со страницы объявления
          </div>
        ) : (
          <>
            <header className={styles.chatHeader}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => onChatChange(null)}
                aria-label="Назад к списку"
              >
                ←
              </button>
              <UserAvatar name={otherUser.name} src={otherAvatar} size="sm" />
              <div className={styles.chatHeaderInfo}>
                <div className={styles.chatTitleRow}>
                  <h4 className={styles.chatTitle}>{otherUser.name}</h4>
                  {otherUser.isStaff && otherUser.role && (
                    <StaffBadge role={otherUser.role} />
                  )}
                </div>
                <p className={styles.chatLogin}>@{otherUser.login}</p>
              </div>
              <button
                type="button"
                className={styles.headerAction}
                disabled={blockLoading}
                onClick={handleBlockToggle}
              >
                {blockedByMe ? 'Разблок.' : 'Блок'}
              </button>
            </header>

            {blockedByMe ? (
              <p className={styles.blockedNotice}>Пользователь заблокирован — разблокируйте, чтобы писать</p>
            ) : (
            <>
            <div className={styles.messageList} ref={messageListRef}>
              {loadingChat ? (
                <p className={styles.emptySidebar}>Загрузка сообщений…</p>
              ) : messages.length === 0 ? (
                <p className={styles.emptySidebar}>Сообщений пока нет — напишите первым</p>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {isRecording && (
              <div className={styles.recordingBar}>
                <span className={styles.recordingDot} />
                Запись {recordingSeconds} с
                <button type="button" className={styles.recordingCancel} onClick={cancelRecording}>
                  Отмена
                </button>
              </div>
            )}

            <form className={styles.composeBar} onSubmit={handleSend} ref={composeBarRef}>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.hiddenInput}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,audio/*"
                onChange={handleFileChange}
              />

              <div className={styles.inputWrap}>
                <button
                  type="button"
                  className={styles.innerBtn}
                  disabled={uploading || isRecording}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Прикрепить файл"
                >
                  📎
                </button>

                <EmojiPicker onPick={insertEmoji} disabled={uploading || isRecording} />
                <textarea
                  ref={draftRef}
                  className={styles.composeInput}
                  rows={1}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onInput={handleDraftInput}
                  onFocus={handleDraftFocus}
                  onKeyDown={handleDraftKeyDown}
                  placeholder={isRecording ? 'Идёт запись…' : 'Сообщение'}
                  maxLength={4000}
                  disabled={isRecording}
                  enterKeyHint="send"
                />

                {canSend ? (
                  <button
                    type="submit"
                    className={styles.sendBtn}
                    aria-label="Отправить"
                  >
                    ↑
                  </button>
                ) : (
                  <button
                    type="button"
                    className={classNames(styles.innerBtn, isRecording && styles.innerBtnActive)}
                    disabled={uploading && !isRecording}
                    onClick={handleVoiceToggle}
                    aria-label="Голосовое сообщение"
                  >
                    {isRecording ? '■' : '🎤'}
                  </button>
                )}
              </div>
            </form>
            </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export {
  MessagesPanel,
}
