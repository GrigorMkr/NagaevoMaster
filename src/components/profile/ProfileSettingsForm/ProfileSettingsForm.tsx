import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/features/user/userSlice';
import type { User } from '@/types/user';
import { Button } from '@/components/ui/Button/Button';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { USE_MOCK_FALLBACK } from '@/config/runtime';
import { updateProfile } from '@/services/usersApi';
import { uploadImage } from '@/services/uploadsApi';
import { buildAvatarUrl } from '@/utils/avatarUrl';
import { getErrorMessage } from '@/utils/errorMessage';
import pageStyles from '@/styles/page.module.css';
import styles from './ProfileSettingsForm.module.css';

interface ProfileSettingsFormProps {
  user: User;
}

function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? buildAvatarUrl(user.name, user.email));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      if (!USE_MOCK_FALLBACK) {
        const uploaded = await uploadImage(file);
        setAvatarUrl(uploaded.url);
      } else {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
          reader.readAsDataURL(file);
        });
        setAvatarUrl(dataUrl);
      }
      toast.success('Аватар обновлён');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить аватар'));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const updatedUser = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl,
      });
      dispatch(setUser(updatedUser));
      toast.success('Профиль сохранён');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сохранить профиль'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.card} aria-labelledby="profile-settings-title">
      <h2 id="profile-settings-title" className={styles.title}>
        Настройки профиля
      </h2>
      <p className={styles.subtitle}>Аватар, имя, телефон и email аккаунта</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.avatarRow}>
          <UserAvatar name={name} src={avatarUrl} size="lg" />
          <div className={styles.avatarActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAvatarPick} loading={isUploading}>
              Сменить аватар
            </Button>
            <p className={styles.hint}>JPG или PNG, до 5 МБ</p>
          </div>
        </div>

        <label className={styles.field}>
          <span>Имя / никнейм</span>
          <input
            className={pageStyles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            placeholder="Как вас видят в объявлениях"
          />
        </label>

        <label className={styles.field}>
          <span>Телефон</span>
          <input
            className={pageStyles.input}
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            minLength={10}
            placeholder="+7 (900) 000-00-00"
          />
        </label>

        <label className={styles.field}>
          <span>Email</span>
          <input className={pageStyles.input} type="email" value={user.email} readOnly disabled />
          <p className={styles.hint}>Email меняется через поддержку</p>
        </label>

        <Button type="submit" loading={isSaving}>
          Сохранить изменения
        </Button>
      </form>
    </section>
  );
}

export {
  ProfileSettingsForm,
}
