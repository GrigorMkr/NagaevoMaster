import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '@/features/user/userSelectors';
import { useChatLiveSync } from '@/hooks/useChatLiveSync';

const UNREAD_MESSAGES_EVENT = 'nagaevo:unread-messages';

function GlobalChatSync() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const [searchParams] = useSearchParams();
  const activeConversationId = searchParams.get('chat');

  const noop = useCallback(() => undefined, []);
  const onUnreadChange = useCallback((count: number) => {
    window.dispatchEvent(new CustomEvent(UNREAD_MESSAGES_EVENT, { detail: count }));
  }, []);

  useChatLiveSync({
    activeConversationId,
    currentUserId: currentUser?.id ?? null,
    enabled: isAuthenticated,
    enableSounds: true,
    onMessages: noop,
    onConversations: noop,
    onUnreadChange,
  });

  return null;
}

export {
  GlobalChatSync,
  UNREAD_MESSAGES_EVENT,
};
