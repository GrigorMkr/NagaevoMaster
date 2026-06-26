import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button/Button';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import {
  createModerationSiteNews,
  deleteModerationSiteNews,
  fetchModerationSiteNews,
  updateModerationSiteNews,
  type SiteNewsItem,
} from '@/services/moderationApi';
import { uploadListingImage } from '@/services/listingsApi';
import { getErrorMessage } from '@/utils/errorMessage';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import styles from './NewsAdminPanel.module.css';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

interface NewsFormState {
  title: string;
  summary: string;
  imageUrl: string;
  sourceUrl: string;
  publishedAt: string;
}

const emptyForm = (): NewsFormState => ({
  title: '',
  summary: '',
  imageUrl: '',
  sourceUrl: '',
  publishedAt: new Date().toISOString().slice(0, 16),
});

function NewsAdminPanel() {
  const [items, setItems] = useState<SiteNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsFormState>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchModerationSiteNews());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить новости'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (item: SiteNewsItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      summary: item.summary,
      imageUrl: item.imageUrl ?? '',
      sourceUrl: item.sourceUrl ?? '',
      publishedAt: item.publishedAt.slice(0, 16),
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Файл больше 2 МБ');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadListingImage(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success('Фото загружено');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить фото'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Укажите заголовок');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        imageUrl: form.imageUrl.trim() || null,
        sourceUrl: form.sourceUrl.trim() || null,
        publishedAt: new Date(form.publishedAt).toISOString(),
      };
      if (editingId) {
        await updateModerationSiteNews(editingId, payload);
        toast.success('Новость обновлена');
      } else {
        await createModerationSiteNews(payload);
        toast.success('Новость добавлена');
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сохранить новость'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить новость?')) return;
    try {
      await deleteModerationSiteNews(id);
      toast.success('Новость удалена');
      if (editingId === id) resetForm();
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось удалить новость'));
    }
  };

  return (
    <div className={styles.panel}>
      <form
        className={styles.form}
        action={ECHO_FORM_ACTION}
        method="post"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <h4 className={styles.formTitle}>{editingId ? 'Редактировать новость' : 'Добавить новость'}</h4>
        <label className={styles.field}>
          <span>Заголовок</span>
          <input
            className={styles.input}
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </label>
        <label className={styles.field}>
          <span>Краткое описание</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={form.summary}
            onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span>Ссылка на источник</span>
          <input
            className={styles.input}
            value={form.sourceUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label className={styles.field}>
          <span>Дата публикации</span>
          <input
            type="datetime-local"
            className={styles.input}
            value={form.publishedAt}
            onChange={(event) => setForm((prev) => ({ ...prev, publishedAt: event.target.value }))}
          />
        </label>
        <div className={styles.photoRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => void handlePhotoUpload(event)}
          />
          <Button
            type="button"
            variant="outline"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Загрузить фото
          </Button>
          {form.imageUrl && (
            <div className={styles.photoThumb}>
              <ListingPhoto src={form.imageUrl} alt="" className={styles.photoImage} />
              <button
                type="button"
                className={styles.photoRemove}
                aria-label="Удалить фото"
                onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
              >
                ×
              </button>
            </div>
          )}
        </div>
        <div className={styles.formActions}>
          <Button type="submit" loading={saving}>
            {editingId ? 'Сохранить' : 'Добавить'}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Отмена
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <p className={styles.status}>Загрузка…</p>
      ) : items.length === 0 ? (
        <p className={styles.status}>Новостей пока нет</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              {item.imageUrl && (
                <ListingPhoto src={item.imageUrl} alt="" className={styles.itemThumb} />
              )}
              <div className={styles.itemBody}>
                <p className={styles.itemTitle}>{item.title}</p>
                <p className={styles.itemMeta}>
                  {format(new Date(item.publishedAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                </p>
                {item.summary && <p className={styles.itemSummary}>{item.summary}</p>}
              </div>
              <div className={styles.itemActions}>
                <Button type="button" variant="outline" onClick={() => startEdit(item)}>
                  Изменить
                </Button>
                <Button type="button" variant="danger" onClick={() => void handleDelete(item.id)}>
                  Удалить
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export {
  NewsAdminPanel,
};
