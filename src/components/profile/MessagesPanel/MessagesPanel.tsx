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
  editMessage,
  deleteMessage,
  forwardMessage,
} from '@/services/messagesApi';
import { blockUser, fetchBlockStatus, unblockUser } from '@/services/blocksApi';
import { MESSAGE_ATTACHMENT_ACCEPT, MESSAGE_ATTACHMENT_HINT, MESSAGE_ATTACHMENT_MAX_BYTES, MESSAGE_ATTACHMENT_MAX_MB } from '@/constants/messageAttachments';
import { uploadMessageAttachment, prepareUploadFile } from '@/services/uploadsApi';
import type { ChatMessage, ConversationSummary, GroupDetail } from '@/types/message';
import { ForwardMessageModal } from '@/components/messages/ForwardMessageModal/ForwardMessageModal';
import { CreateGroupModal } from '@/components/messages/CreateGroupModal/CreateGroupModal';
import { GroupInfoSheet } from '@/components/messages/GroupInfoSheet/GroupInfoSheet';
import { GroupAvatar } from '@/components/messages/GroupAvatar/GroupAvatar';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser } from '@/features/user/userSelectors';
import { EmojiPicker } from '@/components/messages/EmojiPicker/EmojiPicker';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import { PushEnableBanner } from '@/components/push/PushEnableBanner/PushEnableBanner';
import { useChatLiveSync, mergeMessages } from '@/hooks/useChatLiveSync';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { getErrorMessage } from '@/utils/errorMessage';
import { StaffBadge } from '@/components/ui/StaffBadge/StaffBadge';
import { ensurePushNotifications } from '@/services/pushApi';
import { unlockMessageSound } from '@/utils/messageSound';
import { registerOutgoingMessage } from '@/utils/outgoingMessages';
import { useUserLoginSearch, normalizeLoginQuery } from '@/hooks/useUserLoginSearch';
import { useUsersOnline } from '@/hooks/useUsersOnline';
import { UserNameWithStatus } from '@/components/ui/UserNameWithStatus/UserNameWithStatus';
import { canAttemptPushSubscribe } from '@/utils/pushEnvironment';
import { ECHO_FORM_ACTION } from '@/constants/forms';
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<ChatMessage | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [loginQuery, setLoginQuery] = useState('');
  const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null);
  const currentUser = useAppSelector(selectCurrentUser);
  const normalizedLoginQuery = normalizeLoginQuery(loginQuery);
  const { results: loginResults, loading: loginSearching } = useUserLoginSearch(loginQuery);

  const trackedUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of conversations) {
      if (item.otherUser) {
        ids.add(item.otherUser.id);
      }
    }
    for (const user of loginResults) {
      ids.add(user.id);
    }
    if (activeConversation?.otherUser) {
      ids.add(activeConversation.otherUser.id);
    }
    return [...ids];
  }, [activeConversation?.otherUser, conversations, loginResults]);

  const onlineMap = useUsersOnline(trackedUserIds);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const composeBarRef = useRef<HTMLFormElement>(null);
  const isNearBottomRef = useRef(true);
  const shouldStickToBottomRef = useRef(true);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const [newBelowCount, setNewBelowCount] = useState(0);
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
      if (detail.type === 'group' && detail.group) {
        setActiveConversation({
          id: detail.id,
          type: 'group',
          group: {
            name: detail.group.name,
            avatarUrl: detail.group.avatarUrl,
            memberCount: detail.group.memberCount,
          },
          unreadCount: 0,
          updatedAt: detail.messages.at(-1)?.createdAt ?? new Date().toISOString(),
        });
      } else if (detail.otherUser) {
        setActiveConversation({
          id: detail.id,
          type: 'dm',
          otherUser: detail.otherUser,
          unreadCount: 0,
          updatedAt: detail.messages.at(-1)?.createdAt ?? new Date().toISOString(),
        });
      }
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

  const scrollChatToBottom = useCallback((smooth = false) => {
    const run = () => {
      const list = messageListRef.current;
      if (!list) return;

      if (smooth) {
        list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
      } else {
        list.scrollTop = list.scrollHeight;
      }
      isNearBottomRef.current = true;
      shouldStickToBottomRef.current = true;
      setNewBelowCount(0);
    };

    run();
    if (!smooth) {
      requestAnimationFrame(run);
    }
  }, []);

  const updateScrollStickiness = useCallback(() => {
    const list = messageListRef.current;
    if (!list) return;
    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      shouldStickToBottomRef.current = true;
      setNewBelowCount(0);
    }
  }, []);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return undefined;

    const onScroll = () => {
      updateScrollStickiness();
    };

    list.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      list.removeEventListener('scroll', onScroll);
    };
  }, [activeId, loadingChat, updateScrollStickiness]);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setNewBelowCount(0);
      shouldStickToBottomRef.current = true;
      isNearBottomRef.current = true;
      if (!withUserId) {
        setActiveConversation(null);
      }
      return;
    }
    shouldStickToBottomRef.current = true;
    isNearBottomRef.current = true;
    prevLastMessageIdRef.current = null;
    void openConversation(chatId);
  }, [chatId, openConversation, withUserId]);

  useEffect(() => {
    if (!activeId || loadingChat) return;

    const lastMessage = messages.at(-1);
    if (!lastMessage) return;

    const previousLastId = prevLastMessageIdRef.current;
    const isNewTail = previousLastId !== null && previousLastId !== lastMessage.id;
    prevLastMessageIdRef.current = lastMessage.id;

    const stick = shouldStickToBottomRef.current
      || isNearBottomRef.current
      || lastMessage.isMine
      || previousLastId === null;

    if (stick) {
      scrollChatToBottom();
      return;
    }

    if (isNewTail && !lastMessage.isMine) {
      setNewBelowCount((count) => count + 1);
    }
  }, [activeId, loadingChat, messages, scrollChatToBottom]);

  useEffect(() => {
    if (!activeId || loadingChat) return undefined;

    const list = messageListRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      if (!shouldStickToBottomRef.current && !isNearBottomRef.current) return;
      scrollChatToBottom();
    });

    observer.observe(list);
    for (const child of list.children) {
      observer.observe(child);
    }

    return () => {
      observer.disconnect();
    };
  }, [activeId, loadingChat, messages.length, scrollChatToBottom]);

  const handleLiveMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => mergeMessages(current, incoming));
  }, []);

  const handleLiveConversations = useCallback((items: ConversationSummary[]) => {
    setConversations(items);
    setActiveConversation((current) => {
      if (!current) return current;
      const updated = items.find((item) => item.id === current.id);
      if (!updated) return current;
      return {
        ...current,
        ...updated,
        otherUser: current.otherUser ?? updated.otherUser,
        group: current.group ?? updated.group,
      };
    });
  }, []);

  useChatLiveSync({
    activeConversationId: activeId ?? null,
    enabled: true,
    enableSounds: false,
    onMessages: handleLiveMessages,
    onConversations: handleLiveConversations,
    onUnreadChange,
    notifySenderName: activeConversation?.type === 'group'
      ? activeConversation.group?.name
      : activeConversation?.otherUser?.name,
  });

  const insertReaction = useCallback((token: string) => {
    const el = draftRef.current;
    if (!el) {
      setDraft((current) => `${current}${token}`);
      return;
    }

    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${token}${draft.slice(end)}`;
    const cursor = start + token.length;

    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }, [draft]);

  const layoutMode = useMemo(() => (activeId ? 'chat' : 'list'), [activeId]);
  const isMobileChat = layoutMode === 'chat' && Boolean(activeId);
  const [isMobileViewport, setIsMobileViewport] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 899px)').matches
  ));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 899px)');
    const syncViewport = () => {
      setIsMobileViewport(media.matches);
    };
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => {
      media.removeEventListener('change', syncViewport);
    };
  }, []);

  const isMobileChatFullscreen = isMobileChat && isMobileViewport;

  useEffect(() => {
    if (!isMobileChatFullscreen) return undefined;
    document.documentElement.classList.add('mobile-chat-open');
    document.body.classList.add('mobile-chat-open');
    return () => {
      document.documentElement.classList.remove('mobile-chat-open');
      document.body.classList.remove('mobile-chat-open');
    };
  }, [isMobileChatFullscreen]);

  const handleDraftFocus = useCallback(() => {
    unlockMessageSound();
    scrollChatToBottom();
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
      void loadConversations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить сообщение'));
    } finally {
      setSending(false);
    }
  }, [activeId, draft, isRecording, loadConversations, sending, uploading]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    void submitDraft();
  };

  const handleSendAttachment = async (file: File, options?: { prepared?: boolean }) => {
    if (!activeId) return;

    let uploadable: File;
    try {
      uploadable = options?.prepared ? file : await prepareUploadFile(file);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось открыть файл'));
      return;
    }

    if (uploadable.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
      toast.error(`Файл слишком большой. Максимум ${MESSAGE_ATTACHMENT_MAX_MB} МБ`);
      return;
    }

    setUploading(true);
    setUploadFileName(uploadable.name);
    setUploadProgress(0);
    try {
      const uploaded = await uploadMessageAttachment(uploadable, setUploadProgress, { prepared: true });
      setUploadProgress(100);
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
      void loadConversations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить файл'));
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setUploadFileName(null);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const preparedPromise = prepareUploadFile(file);

    void (async () => {
      try {
        const uploadable = await preparedPromise;
        await handleSendAttachment(uploadable, { prepared: true });
      } catch (error) {
        toast.error(getErrorMessage(error, 'Не удалось открыть файл'));
      } finally {
        input.value = '';
      }
    })();
  };

  const handleVoiceToggle = async () => {
    if (!activeId) return;
    if (isRecording) {
      setUploading(true);
      setUploadFileName('Голосовое сообщение');
      setUploadProgress(0);
      try {
        const file = await stopRecording();
        if (!file) {
          toast.error('Запись пуста');
          return;
        }
        const uploaded = await uploadMessageAttachment(file, setUploadProgress);
        setUploadProgress(100);
        const message = await sendMessage(activeId, {
          type: 'voice',
          attachmentUrl: uploaded.url,
          attachmentName: uploaded.name,
          attachmentMime: uploaded.mimeType,
        });
        registerOutgoingMessage(message.id);
        setMessages((current) => [...current, message]);
        void loadConversations();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Не удалось отправить голосовое'));
      } finally {
        setUploading(false);
        setUploadProgress(null);
        setUploadFileName(null);
      }
      return;
    }

    try {
      await startRecording();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Разрешите доступ к микрофону'));
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

  const isGroupChat = activeConversation?.type === 'group';
  const otherUser = activeConversation?.type === 'dm' ? activeConversation.otherUser : undefined;
  const otherUserId = otherUser?.id;
  const chatTitle = isGroupChat
    ? activeConversation?.group?.name ?? 'Сообщество'
    : otherUser?.name ?? '';
  const chatSubtitle = isGroupChat
    ? `${activeConversation?.group?.memberCount ?? 0} участников`
    : otherUser ? `@${otherUser.login}` : '';

  useEffect(() => {
    if (!otherUserId) {
      setBlockedByMe(false);
      return;
    }
    void fetchBlockStatus(otherUserId)
      .then((status) => setBlockedByMe(status.blockedByMe))
      .catch(() => setBlockedByMe(false));
  }, [otherUserId]);

  const handleEditMessage = useCallback(async (messageId: string, body: string) => {
    try {
      const updated = await editMessage(messageId, body);
      setMessages((current) => current.map((item) => (item.id === messageId ? updated : item)));
      void loadConversations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось изменить сообщение'));
      throw error;
    }
  }, [loadConversations]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const updated = await deleteMessage(messageId);
      setMessages((current) => current.map((item) => (item.id === messageId ? updated : item)));
      void loadConversations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось удалить сообщение'));
      throw error;
    }
  }, [loadConversations]);

  const handleForwardSelect = useCallback(async (conversationId: string) => {
    if (!forwardTarget) return;
    try {
      await forwardMessage(forwardTarget.id, conversationId);
      toast.success(
        forwardTarget.type === 'listing' ? 'Объявление переслано' : 'Сообщение переслано',
      );
      setForwardTarget(null);
      void loadConversations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось переслать'));
    }
  }, [forwardTarget, loadConversations]);

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

  useEffect(() => {
    if (!highlightMessageId) return undefined;
    const timer = window.setTimeout(() => setHighlightMessageId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [highlightMessageId]);

  const otherAvatar = otherUser
    ? resolveAuthorAvatar(otherUser.name, otherUser.login, otherUser.avatarUrl)
    : undefined;

  const canSend = Boolean(draft.trim()) && !sending && !uploading && !isRecording;

  const handleCloseGroupInfo = useCallback(() => {
    setShowGroupInfo(false);
  }, []);

  const handleGroupLeft = useCallback(() => {
    setShowGroupInfo(false);
    onChatChange(null);
    void loadConversations();
  }, [loadConversations, onChatChange]);

  const handleGroupUpdated = useCallback((group: GroupDetail) => {
    setActiveConversation((cur) => (
      cur ? {
        ...cur,
        group: {
          name: group.name,
          avatarUrl: group.avatarUrl,
          memberCount: group.memberCount,
        },
      } : cur
    ));
    void loadConversations();
  }, [loadConversations]);

  const handleStartChatByLogin = async (userId: string) => {
    if (userId === currentUser?.id || startingChatUserId) return;
    setStartingChatUserId(userId);
    try {
      const conversation = await startConversation(userId);
      setLoginQuery('');
      onChatChange(conversation.id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось начать переписку'));
    } finally {
      setStartingChatUserId(null);
    }
  };

  return (
    <div
      className={classNames(
        styles.messagesLayout,
        layoutMode === 'chat' ? styles.mobileOnlyChat : styles.mobileOnlyList,
        isMobileChatFullscreen && styles.mobileFullscreen,
      )}
    >
      <aside className={styles.sidebar}>
        <PushEnableBanner compact />
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Чаты</h3>
          <button
            type="button"
            className={styles.createGroupBtn}
            onClick={() => setShowCreateGroup(true)}
            title="Создать сообщество"
            aria-label="Создать сообщество"
          >
            <ToolbarIcon name="plus" accent="#e8b84a" motion="pulse" />
          </button>
        </div>
        <div className={styles.loginSearchWrap}>
          <input
            className={styles.loginSearch}
            value={loginQuery}
            onChange={(e) => setLoginQuery(e.target.value)}
            placeholder="Написать по @логину"
            aria-label="Найти пользователя по логину"
          />
          {normalizedLoginQuery.length >= 2 && (
            <ul className={styles.loginResults}>
              {loginSearching ? (
                <li className={styles.loginResultEmpty}>Поиск…</li>
              ) : loginResults.length === 0 ? (
                <li className={styles.loginResultEmpty}>Никого не найдено</li>
              ) : (
                loginResults
                  .filter((user) => user.id !== currentUser?.id)
                  .map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        className={styles.loginResultBtn}
                        disabled={startingChatUserId === user.id}
                        onClick={() => void handleStartChatByLogin(user.id)}
                      >
                        <UserAvatar
                          name={user.name}
                          src={resolveAuthorAvatar(user.name, user.login, user.avatarUrl)}
                          size="sm"
                        />
                        <span className={styles.loginResultMeta}>
                          <UserNameWithStatus
                            name={user.name}
                            userId={user.id}
                            online={onlineMap[user.id]}
                          />
                          <span className={styles.loginResultLogin}>@{user.login}</span>
                        </span>
                      </button>
                    </li>
                  ))
              )}
            </ul>
          )}
        </div>
        {loadingList ? (
          <p className={styles.emptySidebar}>Загрузка…</p>
        ) : conversations.length === 0 ? (
          <p className={styles.emptySidebar}>
            Переписок пока нет. Найдите человека по @логину выше или откройте чат со страницы объявления.
          </p>
        ) : (
          <ul className={styles.conversationList}>
            {conversations.map((item) => {
              const isGroup = item.type === 'group' && item.group;
              const title = isGroup ? item.group!.name : item.otherUser!.name;
              const preview = item.lastMessage?.body ?? (isGroup ? 'Сообщество' : 'Начните диалог');
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={classNames(
                      styles.conversationItem,
                      activeId === item.id && styles.conversationItemActive,
                      isGroup && styles.conversationItemGroup,
                    )}
                    onClick={() => onChatChange(item.id)}
                  >
                    {isGroup ? (
                      <GroupAvatar name={item.group!.name} avatarUrl={item.group!.avatarUrl} size="sm" />
                    ) : (
                      <UserAvatar
                        name={item.otherUser!.name}
                        src={resolveAuthorAvatar(
                          item.otherUser!.name,
                          item.otherUser!.login,
                          item.otherUser!.avatarUrl,
                        )}
                        size="sm"
                      />
                    )}
                    <div className={styles.conversationBody}>
                      <p className={styles.conversationName}>
                        <span className={styles.conversationNameText}>
                          {!isGroup && item.otherUser ? (
                            <UserNameWithStatus
                              name={title}
                              userId={item.otherUser.id}
                              online={onlineMap[item.otherUser.id]}
                            />
                          ) : (
                            title
                          )}
                        </span>
                        {isGroup && (
                          <span className={styles.groupBadge}>{item.group!.memberCount}</span>
                        )}
                        {!isGroup && item.otherUser!.isStaff && item.otherUser!.role && (
                          <StaffBadge role={item.otherUser!.role} compact />
                        )}
                      </p>
                      <p className={styles.conversationPreview}>{preview}</p>
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
        {!activeId || !activeConversation ? (
          <div className={styles.chatPlaceholder}>
            Выберите диалог, создайте сообщество или откройте переписку со страницы объявления
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
                <ToolbarIcon name="chevronLeft" accent="#7ec8a8" />
              </button>
              {isGroupChat ? (
                <GroupAvatar
                  name={activeConversation.group?.name ?? 'G'}
                  avatarUrl={activeConversation.group?.avatarUrl}
                  size="sm"
                />
              ) : (
                <UserAvatar name={otherUser!.name} src={otherAvatar} size="sm" />
              )}
              <button
                type="button"
                className={styles.chatHeaderInfo}
                onClick={() => isGroupChat && setShowGroupInfo(true)}
              >
                <div className={styles.chatTitleRow}>
                  {!isGroupChat && otherUser ? (
                    <UserNameWithStatus
                      name={chatTitle}
                      userId={otherUser.id}
                      online={onlineMap[otherUser.id]}
                      className={styles.chatTitle}
                      nameClassName={styles.chatTitle}
                    />
                  ) : (
                    <h4 className={styles.chatTitle}>{chatTitle}</h4>
                  )}
                  {!isGroupChat && otherUser!.isStaff && otherUser!.role && (
                    <StaffBadge role={otherUser!.role} />
                  )}
                </div>
                <p className={styles.chatLogin}>{chatSubtitle}</p>
              </button>
              {isGroupChat ? (
                <button
                  type="button"
                  className={styles.headerAction}
                  onClick={() => setShowGroupInfo(true)}
                  aria-label="Информация о группе"
                >
                  <ToolbarIcon name="menu" accent="#7ec8a8" />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.headerAction}
                  disabled={blockLoading}
                  onClick={handleBlockToggle}
                >
                  {blockedByMe ? 'Разблок.' : 'Блок'}
                </button>
              )}
            </header>

            {!isGroupChat && blockedByMe ? (
              <p className={styles.blockedNotice}>Пользователь заблокирован — разблокируйте, чтобы писать</p>
            ) : (
            <>
            <div className={styles.messageListWrap}>
            <div className={styles.messageList} ref={messageListRef}>
              {loadingChat ? (
                <p className={styles.emptySidebar}>Загрузка сообщений…</p>
              ) : messages.length === 0 ? (
                <p className={styles.emptySidebar}>Сообщений пока нет — напишите первым</p>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showSenderName={isGroupChat}
                    senderOnline={isGroupChat ? onlineMap[message.senderId] : undefined}
                    highlighted={highlightMessageId === message.id}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onForward={setForwardTarget}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {newBelowCount > 0 && (
              <button
                type="button"
                className={styles.jumpToLatest}
                onClick={() => scrollChatToBottom(true)}
              >
                <ToolbarIcon name="chevronDown" accent="#0a1f18" motion="float" />
                <span>
                  {newBelowCount === 1 ? 'Новое сообщение' : `Новых: ${newBelowCount}`}
                </span>
              </button>
            )}
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

            {uploading && uploadProgress !== null && (
              <div className={styles.uploadBar} role="status" aria-live="polite">
                <div className={styles.uploadMeta}>
                  <span className={styles.uploadLabel}>
                    Загрузка
                    {uploadFileName ? `: ${uploadFileName}` : ''}
                  </span>
                  <span className={styles.uploadPercent}>{uploadProgress}%</span>
                </div>
                <div className={styles.uploadTrack} aria-hidden>
                  <div
                    className={styles.uploadFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <form className={styles.composeBar} action={ECHO_FORM_ACTION} method="post" onSubmit={handleSend} ref={composeBarRef}>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.hiddenInput}
                accept={MESSAGE_ATTACHMENT_ACCEPT}
                title={MESSAGE_ATTACHMENT_HINT}
                onChange={handleFileChange}
              />

              <div className={styles.inputWrap}>
                <button
                  type="button"
                  className={styles.innerBtn}
                  disabled={uploading || isRecording}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={`Прикрепить файл. ${MESSAGE_ATTACHMENT_HINT}`}
                >
                  <ToolbarIcon name="paperclip" accent="#5eb8ff" motion="float" />
                </button>

                <EmojiPicker onPick={insertReaction} disabled={uploading || isRecording} />
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
                    <ToolbarIcon name="send" accent="#04140f" motion="pulse" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={classNames(styles.innerBtn, isRecording && styles.innerBtnActive)}
                    disabled={uploading && !isRecording}
                    onClick={handleVoiceToggle}
                    aria-label="Голосовое сообщение"
                  >
                    {isRecording ? (
                      <ToolbarIcon name="stop" accent="#ff8a80" motion="pulse" />
                    ) : (
                      <ToolbarIcon name="mic" accent="#7ec8a8" motion="float" />
                    )}
                  </button>
                )}
              </div>
            </form>
            </>
            )}
          </>
        )}
      </section>

      {forwardTarget && (
        <ForwardMessageModal
          conversations={conversations}
          excludeConversationId={activeId ?? undefined}
          onSelect={(id) => void handleForwardSelect(id)}
          onClose={() => setForwardTarget(null)}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          onCreated={(groupId) => {
            setShowCreateGroup(false);
            void loadConversations();
            onChatChange(groupId);
          }}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      {showGroupInfo && activeId && currentUser && (
        <GroupInfoSheet
          groupId={activeId}
          currentUserId={currentUser.id}
          onClose={handleCloseGroupInfo}
          onLeft={handleGroupLeft}
          onUpdated={handleGroupUpdated}
          onJumpToMessage={(msg) => {
            setHighlightMessageId(msg.id);
            const el = document.getElementById(`msg-${msg.id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />
      )}
    </div>
  );
}

export {
  MessagesPanel,
}
