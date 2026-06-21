import { useState } from 'react';
import classNames from 'classnames';
import { MessagesPanel } from '@/components/profile/MessagesPanel/MessagesPanel';
import { FriendsList } from '@/components/profile/FriendsPanel/FriendsList';
import styles from './SocialPanel.module.css';

type SocialTab = 'messages' | 'friends';

interface SocialPanelProps {
  chatId: string | null;
  withUserId: string | null;
  onChatChange: (chatId: string | null) => void;
  onUnreadChange?: (count: number) => void;
  onMessageUser: (userId: string) => void;
  initialTab?: SocialTab;
}

function SocialPanel({
  chatId,
  withUserId,
  onChatChange,
  onUnreadChange,
  onMessageUser,
  initialTab = 'messages',
}: SocialPanelProps) {
  const [tab, setTab] = useState<SocialTab>(
    withUserId || chatId ? 'messages' : initialTab,
  );

  const openMessagesWithUser = (userId: string) => {
    setTab('messages');
    onMessageUser(userId);
  };

  return (
    <div>
      <div className={styles.tabs} role="tablist" aria-label="Общение">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'messages'}
          className={classNames(styles.tab, tab === 'messages' && styles.tabActive)}
          onClick={() => setTab('messages')}
        >
          Сообщения
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'friends'}
          className={classNames(styles.tab, tab === 'friends' && styles.tabActive)}
          onClick={() => setTab('friends')}
        >
          Друзья
        </button>
      </div>

      <div className={styles.panelBody}>
        {tab === 'messages' ? (
          <MessagesPanel
            chatId={chatId}
            withUserId={withUserId}
            onChatChange={onChatChange}
            onUnreadChange={onUnreadChange}
          />
        ) : (
          <FriendsList onMessageUser={openMessagesWithUser} />
        )}
      </div>
    </div>
  );
}

export {
  SocialPanel,
}
