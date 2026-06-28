import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import classNames from 'classnames';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { GroupAvatar } from '@/components/messages/GroupAvatar/GroupAvatar';
import {
  addGroupMembers,
  fetchGroup,
  groupRoleLabel,
  isGroupAdmin,
  leaveGroup,
  removeGroupMember,
  reportGroup,
  searchGroupMessages,
  updateGroup,
} from '@/services/groupsApi';
import { UserMentionPicker } from '@/components/messages/UserMentionPicker/UserMentionPicker';
import { AddFriendButton } from '@/components/friends/AddFriendButton/AddFriendButton';
import { UserNameWithStatus } from '@/components/ui/UserNameWithStatus/UserNameWithStatus';
import { useUsersOnline } from '@/hooks/useUsersOnline';
import { uploadImage } from '@/services/uploadsApi';
import type { ChatMessage, GroupDetail } from '@/types/message';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { getErrorMessage } from '@/utils/errorMessage';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import styles from './GroupInfoSheet.module.css';

interface GroupInfoSheetProps {
  groupId: string;
  currentUserId: string;
  onClose: () => void;
  onLeft: () => void;
  onUpdated: (group: GroupDetail) => void;
  onJumpToMessage?: (message: ChatMessage) => void;
}

function GroupInfoSheet({
  groupId,
  currentUserId,
  onClose,
  onLeft,
  onUpdated,
  onJumpToMessage,
}: GroupInfoSheetProps) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'members' | 'search'>('info');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchRan, setSearchRan] = useState(false);
  const [memberFilter, setMemberFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [pickFriends, setPickFriends] = useState<Set<string>>(new Set());
  const [reportReason, setReportReason] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  const onCloseRef = useRef(onClose);
  const onUpdatedRef = useRef(onUpdated);

  useEffect(() => {
    onCloseRef.current = onClose;
    onUpdatedRef.current = onUpdated;
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGroup(groupId);
      setGroup(data);
      setEditName(data.name);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить сообщество'));
      onCloseRef.current();
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const applyGroupUpdate = useCallback((updated: GroupDetail) => {
    setGroup(updated);
    setEditName(updated.name);
    onUpdatedRef.current(updated);
  }, []);

  const canAdmin = group ? isGroupAdmin(group.myRole) : false;

  const memberIds = useMemo(
    () => new Set(group?.members.map((m) => m.userId) ?? []),
    [group],
  );

  const memberUserIds = useMemo(
    () => group?.members.map((member) => member.userId) ?? [],
    [group],
  );
  const onlineMap = useUsersOnline(memberUserIds);

  const openAddMembers = () => {
    setPickFriends(new Set());
    setAddOpen(true);
  };

  const closeAddMembers = () => {
    setAddOpen(false);
    setPickFriends(new Set());
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!group) return;
    setSaving(true);
    try {
      const updated = await updateGroup(groupId, { name: editName.trim() });
      applyGroupUpdate(updated);
      setEditing(false);
      toast.success('Сообщество обновлено');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сохранить'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (file: File) => {
    if (!canAdmin) return;
    setSaving(true);
    try {
      const uploaded = await uploadImage(file);
      const updated = await updateGroup(groupId, { avatarUrl: uploaded.url });
      applyGroupUpdate(updated);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить фото'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddMembers = async () => {
    if (pickFriends.size === 0) return;
    setSaving(true);
    try {
      const updated = await addGroupMembers(groupId, [...pickFriends]);
      applyGroupUpdate(updated);
      closeAddMembers();
      toast.success('Участники добавлены');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось добавить'));
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Выйти из сообщества?')) return;
    try {
      await leaveGroup(groupId, currentUserId);
      toast.success('Вы вышли из сообщества');
      onLeft();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось выйти'));
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Удалить участника из группы?')) return;
    try {
      const updated = await removeGroupMember(groupId, userId);
      applyGroupUpdate(updated);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось удалить'));
    }
  };

  const handleReport = async () => {
    try {
      await reportGroup(groupId, reportReason.trim() || undefined);
      toast.success('Жалоба отправлена администратору');
      setReportOpen(false);
      setReportReason('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить жалобу'));
    }
  };

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      toast.error('Минимум 2 символа');
      return;
    }
    setSearching(true);
    setSearchRan(false);
    try {
      const result = await searchGroupMessages(groupId, q);
      setSearchResults(result.results);
      setSearchRan(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ошибка поиска'));
    } finally {
      setSearching(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!group) return [];
    const needle = memberFilter.trim().toLowerCase();
    if (!needle) return group.members;
    return group.members.filter((member) => {
      const name = member.user.name.toLowerCase();
      const login = member.user.login.toLowerCase();
      return name.includes(needle) || login.includes(needle);
    });
  }, [group, memberFilter]);

  const sheet = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.heroBg} aria-hidden />

        {loading && !group ? (
          <p className={styles.loading}>Загрузка…</p>
        ) : group ? (
          <>
        <header className={styles.header}>
          <button type="button" className={styles.back} onClick={onClose} aria-label="Назад">
            <ToolbarIcon name="chevronLeft" accent="#7ec8a8" />
          </button>
          <div className={styles.tabs} role="tablist">
            {(['info', 'members', 'search'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={classNames(styles.tab, tab === key && styles.tabActive)}
                onClick={() => {
                  setTab(key);
                  if (key !== 'search') {
                    setSearchRan(false);
                  }
                  if (key !== 'members') {
                    setMemberFilter('');
                  }
                }}
              >
                {key === 'info' ? 'Инфо' : key === 'members' ? 'Участники' : 'Поиск'}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.panelBody}>
        {tab === 'info' && (
          <div className={styles.infoTab}>
            <label className={classNames(styles.avatarBlock, canAdmin && styles.avatarEditable)}>
              <GroupAvatar name={group.name} avatarUrl={group.avatarUrl} size="lg" />
              {canAdmin && (
                <input
                  type="file"
                  accept="image/*"
                  className={styles.hidden}
                  disabled={saving}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void handleAvatar(file);
                  }}
                />
              )}
            </label>

            {editing ? (
              <form className={styles.editForm} action={ECHO_FORM_ACTION} method="post" onSubmit={(e) => void handleSave(e)}>
                <input
                  className={styles.nameEdit}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={80}
                  autoFocus
                />
                <div className={styles.editActions}>
                  <button type="button" onClick={() => setEditing(false)}>Отмена</button>
                  <button type="submit" disabled={saving}>Сохранить</button>
                </div>
              </form>
            ) : (
              <>
                <h2 className={styles.groupName}>{group.name}</h2>
                <p className={styles.meta}>
                  {group.memberCount}
                  {' '}
                  {group.memberCount === 1 ? 'участник' : group.memberCount < 5 ? 'участника' : 'участников'}
                </p>
                {canAdmin && (
                  <button type="button" className={styles.editBtn} onClick={() => setEditing(true)}>
                    Изменить название
                  </button>
                )}
              </>
            )}

            <div className={styles.actions}>
              {canAdmin && (
                <button type="button" className={styles.actionPrimary} onClick={openAddMembers}>
                  + Добавить участников
                </button>
              )}
              <button type="button" className={styles.actionDanger} onClick={() => void handleLeave()}>
                Выйти из группы
              </button>
              <button type="button" className={styles.actionMuted} onClick={() => setReportOpen(true)}>
                Пожаловаться админу сайта
              </button>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <>
            <div className={styles.memberSearchBar}>
              <input
                className={styles.memberSearchInput}
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                placeholder="Поиск по имени или @логину…"
                aria-label="Поиск участников"
              />
            </div>
            <ul className={styles.memberList}>
            {filteredMembers.length === 0 ? (
              <li className={styles.searchEmpty}>Участники не найдены</li>
            ) : filteredMembers.map((member) => {
              const avatar = resolveAuthorAvatar(
                member.user.name,
                member.user.login,
                member.user.avatarUrl,
              );
              const roleLabel = groupRoleLabel(member.role);
              return (
                <li key={member.userId} className={styles.memberRow}>
                  <UserAvatar name={member.user.name} src={avatar} size="sm" />
                  <div className={styles.memberInfo}>
                    <UserNameWithStatus
                      name={member.user.name}
                      userId={member.userId === currentUserId ? undefined : member.userId}
                      online={member.userId === currentUserId ? undefined : (onlineMap[member.userId] ?? false)}
                      nameClassName={styles.memberName}
                    />
                    <span className={styles.memberLogin}>@{member.user.login}</span>
                    {roleLabel && <span className={styles.roleBadge}>{roleLabel}</span>}
                  </div>
                  <div className={styles.memberActions}>
                    {member.userId !== currentUserId && (
                      <AddFriendButton userId={member.userId} size="sm" />
                    )}
                    {canAdmin && member.userId !== currentUserId && member.role !== 'owner' && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => void handleRemove(member.userId)}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          </>
        )}

        {tab === 'search' && (
          <div className={styles.searchTab}>
            <div className={styles.searchBar}>
              <input
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchRan(false);
                }}
                placeholder="Ключевые слова в переписке…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void runSearch();
                  }
                }}
              />
              <button type="button" className={styles.searchBtn} disabled={searching} onClick={() => void runSearch()}>
                {searching ? '…' : 'Найти'}
              </button>
            </div>
            <ul className={styles.searchResults}>
              {searchResults.length === 0 ? (
                <li className={styles.searchEmpty}>
                  {searchRan ? 'Сообщений не найдено' : 'Введите запрос и нажмите «Найти»'}
                </li>
              ) : (
                searchResults.map((msg) => (
                  <li key={msg.id}>
                    <button
                      type="button"
                      className={styles.searchHit}
                      onClick={() => {
                        onJumpToMessage?.(msg);
                        onClose();
                      }}
                    >
                      <span className={styles.searchAuthor}>{msg.senderName}</span>
                      <span className={styles.searchBody}>{msg.body || msg.attachmentName || 'Вложение'}</span>
                      <time className={styles.searchTime}>
                        {new Date(msg.createdAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
        </div>
          </>
        ) : null}

        <div
          className={classNames(styles.subOverlay, !addOpen && styles.subOverlayHidden)}
          onClick={closeAddMembers}
          aria-hidden={!addOpen}
        >
          <div className={styles.subSheet} onClick={(e) => e.stopPropagation()}>
            <h4>Добавить участников</h4>
            <UserMentionPicker
              selected={pickFriends}
              onToggle={(userId) => {
                setPickFriends((cur) => {
                  const next = new Set(cur);
                  if (next.has(userId)) next.delete(userId);
                  else next.add(userId);
                  return next;
                });
              }}
              excludeUserIds={memberIds}
              currentUserId={currentUserId}
              emptyLabel="Введите @логин или имя"
            />
            <button
              type="button"
              className={styles.actionPrimary}
              disabled={pickFriends.size === 0 || saving}
              onClick={() => void handleAddMembers()}
            >
              Добавить ({pickFriends.size})
            </button>
          </div>
        </div>

        <div
          className={classNames(styles.subOverlay, !reportOpen && styles.subOverlayHidden)}
          onClick={() => setReportOpen(false)}
          aria-hidden={!reportOpen}
        >
          <div className={styles.subSheet} onClick={(e) => e.stopPropagation()}>
            <h4>Жалоба на сообщество</h4>
            <textarea
              className={styles.reportInput}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Опишите проблему (необязательно)"
              rows={4}
              maxLength={1000}
            />
            <button type="button" className={styles.actionDanger} onClick={() => void handleReport()}>
              Отправить жалобу
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

export {
  GroupInfoSheet,
};
