import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  banModerationUser,
  fetchModerationUsers,
  unbanModerationUser,
  updateModerationUserRole,
} from '@/services/moderationApi';
import type { ModerationUserItem } from '@/services/moderationApi';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './AdminUsersPanel.module.css';

const ROLES = [
  { value: 'user', label: 'Пользователь' },
  { value: 'master', label: 'Мастер' },
  { value: 'moderator', label: 'Модератор' },
  { value: 'admin', label: 'Админ' },
] as const;

function AdminUsersPanel() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ModerationUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search = query) => {
    setLoading(true);
    try {
      setUsers(await fetchModerationUsers(search));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить пользователей'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const handleBanToggle = async (user: ModerationUserItem) => {
    setBusyId(user.id);
    try {
      if (user.isBanned) {
        await unbanModerationUser(user.id);
        toast.success('Пользователь разблокирован');
      } else {
        await banModerationUser(user.id, 'Блокировка администратором');
        toast.success('Пользователь заблокирован');
      }
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось изменить статус'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setBusyId(userId);
    try {
      await updateModerationUserRole(userId, role);
      toast.success('Роль обновлена');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сменить роль'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.root}>
      <label className={styles.search}>
        <span className="sr-only">Поиск пользователей</span>
        <input
          className={styles.searchInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по имени или email…"
        />
      </label>

      {loading ? (
        <p className={styles.status}>Загрузка…</p>
      ) : users.length === 0 ? (
        <p className={styles.status}>Пользователи не найдены</p>
      ) : (
        <ul className={styles.list}>
          {users.map((user) => (
            <li key={user.id} className={user.isBanned ? styles.rowBanned : styles.row}>
              <div className={styles.main}>
                <p className={styles.name}>
                  {user.name}
                  {user.isBanned && <span className={styles.bannedTag}>заблокирован</span>}
                </p>
                <p className={styles.meta}>
                  {user.email}
                  {' · '}
                  @
                  {user.login}
                </p>
                <p className={styles.meta}>
                  Регистрация:
                  {' '}
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className={styles.actions}>
                <select
                  className={styles.roleSelect}
                  value={user.role}
                  disabled={busyId === user.id}
                  onChange={(event) => void handleRoleChange(user.id, event.target.value)}
                  aria-label={`Роль ${user.name}`}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={user.isBanned ? styles.unbanBtn : styles.banBtn}
                  disabled={busyId === user.id}
                  onClick={() => void handleBanToggle(user)}
                >
                  {user.isBanned ? 'Разблок.' : 'Блок'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export {
  AdminUsersPanel,
};
