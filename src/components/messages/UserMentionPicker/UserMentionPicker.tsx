import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { fetchFriendsOverview } from '@/services/friendsApi';
import { useUserLoginSearch, normalizeLoginQuery } from '@/hooks/useUserLoginSearch';
import type { FriendEntry, FriendSearchResult } from '@/types/friend';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import styles from './UserMentionPicker.module.css';

interface UserMentionPickerProps {
  selected: Set<string>;
  onToggle: (userId: string) => void;
  excludeUserIds?: Set<string>;
  currentUserId?: string;
  emptyLabel?: string;
}

function UserMentionPicker({
  selected,
  onToggle,
  excludeUserIds,
  currentUserId,
  emptyLabel = 'Никого не найдено',
}: UserMentionPickerProps) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [search, setSearch] = useState('');
  const normalized = normalizeLoginQuery(search);
  const { results: searchResults, loading: searching } = useUserLoginSearch(search);

  useEffect(() => {
    void fetchFriendsOverview()
      .then((overview) => setFriends(overview.friends))
      .finally(() => setLoadingFriends(false));
  }, []);

  const suggestions = useMemo(() => {
    const map = new Map<string, FriendSearchResult>();
    for (const entry of friends) {
      if (excludeUserIds?.has(entry.user.id) || entry.user.id === currentUserId) continue;
      map.set(entry.user.id, { ...entry.user, relation: 'friends', friendshipId: entry.id });
    }
    for (const user of searchResults) {
      if (excludeUserIds?.has(user.id) || user.id === currentUserId) continue;
      map.set(user.id, user);
    }
    const items = [...map.values()];
    if (normalized.length >= 2) {
      const q = normalized.toLowerCase();
      return items.filter((user) =>
        user.name.toLowerCase().includes(q)
        || user.login.toLowerCase().includes(q),
      );
    }
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((user) =>
      user.name.toLowerCase().includes(q)
      || user.login.toLowerCase().includes(q),
    );
  }, [currentUserId, excludeUserIds, friends, normalized, search, searchResults]);

  const isLoading = (normalized.length >= 2 && searching) || (loadingFriends && friends.length === 0);

  return (
    <div className={styles.wrap}>
      <input
        className={styles.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="@логин или имя"
        autoComplete="off"
      />
      <ul className={styles.list}>
        {isLoading ? (
          <li className={styles.empty}>Поиск…</li>
        ) : suggestions.length === 0 ? (
          <li className={styles.empty}>{emptyLabel}</li>
        ) : (
          suggestions.map((user) => {
            const isOn = selected.has(user.id);
            const avatar = resolveAuthorAvatar(user.name, user.login, user.avatarUrl);
            return (
              <li key={user.id}>
                <button
                  type="button"
                  className={classNames(styles.row, isOn && styles.rowOn)}
                  onClick={() => onToggle(user.id)}
                >
                  <UserAvatar name={user.name} src={avatar} size="sm" />
                  <span className={styles.meta}>
                    <span className={styles.name}>{user.name}</span>
                    <span className={styles.login}>@{user.login}</span>
                  </span>
                  <span className={classNames(styles.check, isOn && styles.checkOn)}>
                    {isOn ? '✓' : ''}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export {
  UserMentionPicker,
};
