import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import classNames from 'classnames';
import { useAppSelector } from '@/app/hooks';
import { selectCanModerate } from '@/features/user/userSelectors';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
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
import { AvatarLightbox } from './AvatarLightbox';
import { UserNameWithStatus } from '@/components/ui/UserNameWithStatus/UserNameWithStatus';
import { useUsersOnline } from '@/hooks/useUsersOnline';
import styles from './FriendsPanel.module.css';

interface FriendUserRowProps {
  user: FriendUser;
  badge?: string;
  showBirthdayCake?: boolean;
  online?: boolean;
  onOpenProfile: () => void;
  onOpenAvatar: () => void;
  onOpenMenu: () => void;
  menuOpen: boolean;
  menu: ReactNode;
}

function FriendUserRow({
  user,
  badge,
  showBirthdayCake = false,
  online,
  onOpenProfile,
  onOpenAvatar,
  onOpenMenu,
  menuOpen,
  menu,
}: FriendUserRowProps) {
  const avatar = resolveAuthorAvatar(user.name, user.login, user.avatarUrl);

  return (
    <li className={classNames(styles.row, menuOpen && styles.rowActive)}>
      <button
        type="button"
        className={styles.avatarBtn}
        onClick={onOpenAvatar}
        aria-label="Открыть фото"
      >
        <UserAvatar
          name={user.name}
          src={avatar}
          size="sm"
          showBirthdayCake={showBirthdayCake && Boolean(user.birthdayToday)}
        />
      </button>
      <button
        type="button"
        className={styles.identity}
        onClick={onOpenProfile}
      >
        <UserNameWithStatus
          name={user.name}
          userId={user.id}
          online={online}
          nameClassName={styles.userName}
        />
        <span className={styles.userLogin}>@{user.login}</span>
      </button>
      {badge && <span className={styles.badge}>{badge}</span>}
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onOpenMenu}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Действия"
      >
        <ToolbarIcon name="menu" accent="currentColor" motion="none" />
      </button>
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
  onOpenProfile,
  onOpenAvatar,
  onlineMap,
}: {
  entry: FriendEntry;
  onMessageUser?: (userId: string) => void;
  menuUserId: string | null;
  setMenuUserId: (id: string | null) => void;
  closeMenu: () => void;
  runAction: ReturnType<typeof useFriendActions>['runAction'];
  onOpenProfile: (userId: string) => void;
  onOpenAvatar: (user: FriendUser) => void;
  onlineMap: Record<string, boolean>;
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
      showBirthdayCake={entry.status === 'accepted'}
      online={onlineMap[entry.user.id]}
      menuOpen={isOpen}
      onOpenProfile={() => onOpenProfile(entry.user.id)}
      onOpenAvatar={() => onOpenAvatar(entry.user)}
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
  onOpenProfile,
  onOpenAvatar,
  onlineMap,
}: {
  user: FriendSearchResult;
  onChanged: () => void;
  onMessageUser?: (userId: string) => void;
  canModerate: boolean;
  menuUserId: string | null;
  setMenuUserId: (id: string | null) => void;
  closeMenu: () => void;
  runAction: ReturnType<typeof useFriendActions>['runAction'];
  onOpenProfile: (userId: string) => void;
  onOpenAvatar: (user: FriendUser) => void;
  onlineMap: Record<string, boolean>;
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
      showBirthdayCake={user.relation === 'friends'}
      online={onlineMap[user.id]}
      menuOpen={isOpen}
      onOpenProfile={() => onOpenProfile(user.id)}
      onOpenAvatar={() => onOpenAvatar(user)}
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

  const [avatarLightbox, setAvatarLightbox] = useState<{ src: string; alt: string } | null>(null);

  const openProfile = useCallback((userId: string) => {
    closeMenu();
    setProfileUserId(userId);
  }, [closeMenu, setProfileUserId]);

  const openAvatar = useCallback((user: FriendUser) => {
    const src = resolveAuthorAvatar(user.name, user.login, user.avatarUrl);
    if (src) {
      setAvatarLightbox({ src, alt: user.name });
    }
  }, []);

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

  const trackedUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of [...overview.friends, ...overview.incoming, ...overview.outgoing]) {
      ids.add(entry.user.id);
    }
    for (const user of searchResults) {
      ids.add(user.id);
    }
    return [...ids];
  }, [overview.friends, overview.incoming, overview.outgoing, searchResults]);

  const onlineMap = useUsersOnline(trackedUserIds);

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
    onOpenProfile: openProfile,
    onOpenAvatar: openAvatar,
    onlineMap,
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

      {overview.outgoing.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Исходящие
            <span className={styles.count}>{overview.outgoing.length}</span>
          </h3>
          <ul className={styles.list}>
            {overview.outgoing.map((entry) => (
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
          <ul className={styles.list}>
            {overview.friends.map((entry) => (
              <FriendEntryRow key={entry.id} entry={entry} {...rowProps} />
            ))}
          </ul>
        )}
      </section>

      <p className={styles.hint}>Нажмите на имя — профиль и контакты · ⋯ — действия</p>

      <FriendProfileSheet
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />

      {avatarLightbox && (
        <AvatarLightbox
          src={avatarLightbox.src}
          alt={avatarLightbox.alt}
          onClose={() => setAvatarLightbox(null)}
        />
      )}
    </div>
  );
}

export {
  FriendsList,
};
