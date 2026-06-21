import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import classNames from 'classnames';
import { useAppSelector } from '@/app/hooks';
import { selectCanModerate } from '@/features/user/userSelectors';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import {
  acceptFriendRequest,
  fetchFriendsOverview,
  removeFriendship,
  searchFriends,
  sendFriendRequest,
} from '@/services/friendsApi';
import { blockUser } from '@/services/blocksApi';
import type { FriendEntry, FriendSearchResult, FriendsOverview, FriendUser } from '@/types/friend';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { getErrorMessage } from '@/utils/errorMessage';
import { FriendActionMenu, type FriendMenuAction } from './FriendActionMenu';
import { FriendProfileSheet } from './FriendProfileSheet';
import styles from './FriendsPanel.module.css';

interface FriendUserRowProps {
  user: FriendUser;
  badge?: string;
  onOpenMenu: () => void;
  menuOpen: boolean;
  menu: ReactNode;
}

function FriendUserRow({ user, badge, onOpenMenu, menuOpen, menu }: FriendUserRowProps) {
  const avatar = resolveAuthorAvatar(user.name, user.login, user.avatarUrl);

  return (
    <li className={classNames(styles.row, menuOpen && styles.rowActive)}>
      <UserAvatar name={user.name} src={avatar} size="sm" />
      <button
        type="button"
        className={styles.identity}
        onClick={onOpenMenu}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className={styles.userName}>{user.name}</span>
        <span className={styles.userLogin}>@{user.login}</span>
      </button>
      {badge && <span className={styles.badge}>{badge}</span>}
      {menu}
    </li>
  );
}

function useFriendActions({
  onChanged,
  onMessageUser,
}: {
  onChanged: () => void;
  onMessageUser?: (userId: string) => void;
}) {
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const closeMenu = useCallback(() => setMenuUserId(null), []);

  const runAction = useCallback(async (
    action: FriendMenuAction,
    ctx: {
      user: FriendUser;
      friendshipId?: string;
      status?: string;
      relation?: FriendSearchResult['relation'];
    },
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      switch (action) {
        case 'message':
          onMessageUser?.(ctx.user.id);
          break;
        case 'accept':
          if (!ctx.friendshipId) return;
          await acceptFriendRequest(ctx.friendshipId);
          toast.success('Заявка принята');
          onChanged();
          break;
        case 'remove':
          if (!ctx.friendshipId) return;
          await removeFriendship(ctx.friendshipId);
          toast.success(ctx.status === 'accepted' ? 'Удалён из друзей' : 'Заявка отменена');
          onChanged();
          break;
        case 'block':
          await blockUser(ctx.user.id);
          if (ctx.friendshipId) {
            await removeFriendship(ctx.friendshipId).catch(() => undefined);
          }
          toast.success('Пользователь заблокирован');
          onChanged();
          break;
        case 'profile':
          setProfileUserId(ctx.user.id);
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось выполнить действие'));
    } finally {
      setBusy(false);
    }
  }, [busy, onChanged, onMessageUser]);

  return {
    menuUserId,
    setMenuUserId,
    profileUserId,
    setProfileUserId,
    closeMenu,
    runAction,
    busy,
  };
}

function FriendEntryRow({
  entry,
  onMessageUser,
  menuUserId,
  setMenuUserId,
  closeMenu,
  runAction,
}: {
  entry: FriendEntry;
  onMessageUser?: (userId: string) => void;
  menuUserId: string | null;
  setMenuUserId: (id: string | null) => void;
  closeMenu: () => void;
  runAction: ReturnType<typeof useFriendActions>['runAction'];
}) {
  const isOpen = menuUserId === entry.user.id;
  const canMessage = entry.status === 'accepted';

  const actions = useMemo(() => {
    const items: Array<{ id: FriendMenuAction; label: string; tone?: 'default' | 'danger' }> = [];
    if (canMessage && onMessageUser) {
      items.push({ id: 'message', label: 'Написать' });
    }
    if (entry.direction === 'incoming' && entry.status === 'pending') {
      items.push({ id: 'accept', label: 'Принять заявку' });
    }
    items.push({ id: 'profile', label: 'Просмотр профиля' });
    items.push({
      id: 'remove',
      label: entry.status === 'accepted' ? 'Удалить из друзей' : entry.direction === 'incoming' ? 'Отклонить' : 'Отменить заявку',
      tone: 'danger',
    });
    if (entry.status === 'accepted' || entry.direction === 'incoming') {
      items.push({ id: 'block', label: 'Заблокировать', tone: 'danger' });
    }
    return items;
  }, [canMessage, entry.direction, entry.status, onMessageUser]);

  const badge = entry.status === 'pending'
    ? (entry.direction === 'incoming' ? 'Входящая' : 'Исходящая')
    : undefined;

  return (
    <FriendUserRow
      user={entry.user}
      badge={badge}
      menuOpen={isOpen}
      onOpenMenu={() => setMenuUserId(isOpen ? null : entry.user.id)}
      menu={(
        <FriendActionMenu
          open={isOpen}
          userName={entry.user.name}
          actions={actions}
          onSelect={(action) => void runAction(action, {
            user: entry.user,
            friendshipId: entry.id,
            status: entry.status,
          })}
          onClose={closeMenu}
        />
      )}
    />
  );
}

function SearchResultRow({
  user,
  onChanged,
  onMessageUser,
  canModerate,
  menuUserId,
  setMenuUserId,
  closeMenu,
  runAction,
}: {
  user: FriendSearchResult;
  onChanged: () => void;
  onMessageUser?: (userId: string) => void;
  canModerate: boolean;
  menuUserId: string | null;
  setMenuUserId: (id: string | null) => void;
  closeMenu: () => void;
  runAction: ReturnType<typeof useFriendActions>['runAction'];
}) {
  const [adding, setAdding] = useState(false);
  const isOpen = menuUserId === user.id;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await sendFriendRequest(user.id);
      toast.success(user.relation === 'pending_received' ? 'Теперь вы друзья' : 'Заявка отправлена');
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить заявку'));
    } finally {
      setAdding(false);
    }
  };

  const actions = useMemo(() => {
    const items: Array<{ id: FriendMenuAction; label: string; tone?: 'default' | 'danger' }> = [];
    if ((user.relation === 'friends' || canModerate) && onMessageUser) {
      items.push({ id: 'message', label: 'Написать' });
    }
    if (user.relation === 'none') {
      items.push({ id: 'accept', label: 'В друзья' });
    }
    if (user.relation === 'pending_received' && user.friendshipId) {
      items.push({ id: 'accept', label: 'Принять заявку' });
    }
    items.push({ id: 'profile', label: 'Просмотр профиля' });
    if (user.friendshipId && user.relation !== 'none') {
      items.push({
        id: 'remove',
        label: user.relation === 'friends' ? 'Удалить из друзей' : 'Отменить заявку',
        tone: 'danger',
      });
    }
    if (user.relation === 'friends' || user.relation === 'pending_received' || canModerate) {
      items.push({ id: 'block', label: 'Заблокировать', tone: 'danger' });
    }
    return items;
  }, [canModerate, onMessageUser, user.friendshipId, user.relation]);

  const badge = user.relation === 'pending_sent'
    ? 'Отправлено'
    : user.relation === 'friends'
      ? 'Друг'
      : undefined;

  const handleSelect = async (action: FriendMenuAction) => {
    if (action === 'accept' && user.relation === 'none') {
      await handleAdd();
      return;
    }
    void runAction(action, {
      user,
      friendshipId: user.friendshipId,
      relation: user.relation,
    });
  };

  return (
    <FriendUserRow
      user={user}
      badge={badge}
      menuOpen={isOpen}
      onOpenMenu={() => setMenuUserId(isOpen ? null : user.id)}
      menu={(
        <FriendActionMenu
          open={isOpen}
          userName={user.name}
          actions={actions.map((item) => (
            item.id === 'accept' && user.relation === 'none'
              ? { ...item, disabled: adding }
              : item
          ))}
          onSelect={(action) => void handleSelect(action)}
          onClose={closeMenu}
        />
      )}
    />
  );
}

function FriendsList({ onMessageUser }: { onMessageUser?: (userId: string) => void }) {
  const canModerate = useAppSelector(selectCanModerate);
  const [overview, setOverview] = useState<FriendsOverview>({ friends: [], incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await fetchFriendsOverview());
    } catch {
      setOverview({ friends: [], incoming: [], outgoing: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    menuUserId,
    setMenuUserId,
    profileUserId,
    setProfileUserId,
    closeMenu,
    runAction,
  } = useFriendActions({ onChanged: load, onMessageUser });

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchFriends(query)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  if (loading) {
    return <p className={styles.empty}>Загрузка…</p>;
  }

  const rowProps = {
    menuUserId,
    setMenuUserId,
    closeMenu,
    runAction,
    onMessageUser,
    canModerate,
    onChanged: () => { void load(); setSearchQuery(''); },
  };

  return (
    <div className={styles.panel}>
      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Поиск по имени или email"
          enterKeyHint="search"
        />
      </div>

      {searchQuery.trim().length >= 2 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Результаты</h3>
          <ul className={styles.list}>
            {searching ? (
              <li className={styles.empty}>Поиск…</li>
            ) : searchResults.length === 0 ? (
              <li className={styles.empty}>Никого не найдено</li>
            ) : (
              searchResults.map((user) => (
                <SearchResultRow key={user.id} user={user} {...rowProps} />
              ))
            )}
          </ul>
        </section>
      )}

      {overview.incoming.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Входящие
            <span className={styles.count}>{overview.incoming.length}</span>
          </h3>
          <ul className={styles.list}>
            {overview.incoming.map((entry) => (
              <FriendEntryRow key={entry.id} entry={entry} {...rowProps} />
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Друзья
          <span className={styles.count}>{overview.friends.length}</span>
        </h3>
        {overview.friends.length === 0 ? (
          <p className={styles.empty}>Пока нет друзей — найдите человека через поиск</p>
        ) : (
          <ul className={classNames(styles.list, styles.friendsGrid)}>
            {overview.friends.map((entry) => (
              <FriendEntryRow key={entry.id} entry={entry} {...rowProps} />
            ))}
          </ul>
        )}
      </section>

      <p className={styles.hint}>Нажмите на имя — меню действий</p>

      <FriendProfileSheet
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </div>
  );
}

export {
  FriendsList,
};
