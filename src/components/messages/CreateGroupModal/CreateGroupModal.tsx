import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { GroupAvatar } from '@/components/messages/GroupAvatar/GroupAvatar';
import { UserMentionPicker } from '@/components/messages/UserMentionPicker/UserMentionPicker';
import { createGroup } from '@/services/groupsApi';
import { uploadImage } from '@/services/uploadsApi';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser } from '@/features/user/userSelectors';
import { getErrorMessage } from '@/utils/errorMessage';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import styles from './CreateGroupModal.module.css';

interface CreateGroupModalProps {
  onCreated: (groupId: string) => void;
  onClose: () => void;
}

function CreateGroupModal({ onCreated, onClose }: CreateGroupModalProps) {
  const currentUser = useAppSelector(selectCurrentUser);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const toggleUser = (userId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAvatar = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await uploadImage(file);
      setAvatarUrl(uploaded.url);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить фото'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error('Введите название сообщества');
      return;
    }
    setSubmitting(true);
    try {
      const group = await createGroup({
        name: trimmed,
        memberIds: [...selected],
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      toast.success('Сообщество создано');
      onCreated(group.id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось создать сообщество'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <form className={styles.sheet} action={ECHO_FORM_ACTION} method="post" onClick={(e) => e.stopPropagation()} onSubmit={(e) => void handleSubmit(e)}>
        <div className={styles.glow} aria-hidden />

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Новое сообщество</p>
            <h3>Создать группу</h3>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className={styles.hero}>
          <label className={styles.avatarPick}>
            <GroupAvatar name={name || 'G'} avatarUrl={avatarUrl} size="lg" />
            <span className={styles.avatarHint}>
              {uploading ? 'Загрузка…' : 'Фото группы'}
            </span>
            <input
              type="file"
              accept="image/*"
              className={styles.hidden}
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void handleAvatar(file);
              }}
            />
          </label>

          <input
            className={styles.nameInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название сообщества"
            maxLength={80}
            autoFocus
          />
        </div>

        <div className={styles.friendsSection}>
          <div className={styles.friendsHead}>
            <h4>Добавить участников</h4>
            <span className={styles.count}>{selected.size} выбрано</span>
          </div>
          <UserMentionPicker
            selected={selected}
            onToggle={toggleUser}
            currentUserId={currentUser?.id}
            emptyLabel="Введите @логин или имя"
          />
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className={styles.createBtn} disabled={submitting || uploading}>
            {submitting ? 'Создание…' : 'Создать сообщество'}
          </button>
        </footer>
      </form>
    </div>
  );
}

export {
  CreateGroupModal,
};
