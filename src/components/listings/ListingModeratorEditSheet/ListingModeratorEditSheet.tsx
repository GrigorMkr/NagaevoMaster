import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button/Button';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import { adminEditModerationListing } from '@/services/moderationApi';
import { uploadListingImage } from '@/services/listingsApi';
import type { Listing } from '@/types/listing';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './ListingModeratorEditSheet.module.css';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

interface ListingModeratorEditSheetProps {
  listing: Listing;
  onClose: () => void;
  onSaved: (listing: Listing) => void;
}

function ListingModeratorEditSheet({ listing, onClose, onSaved }: ListingModeratorEditSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [phone, setPhone] = useState(listing.phone);
  const [images, setImages] = useState(listing.images);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (images.length >= MAX_PHOTOS) {
      toast.error(`Максимум ${MAX_PHOTOS} фото`);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Файл больше 2 МБ');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadListingImage(file);
      setImages((prev) => [...prev, url]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить фото'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminEditModerationListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        phone: phone.trim(),
        imageIds: images,
      });
      toast.success('Объявление обновлено');
      onSaved(updated);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сохранить'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const sheet = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>Редактирование</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className={styles.body}>
          <label className={styles.field}>
            <span>Заголовок</span>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Описание</span>
            <textarea
              className={styles.textarea}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Телефон</span>
            <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <div className={styles.photos}>
            <span className={styles.fieldLabel}>Фото</span>
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
              size="sm"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Добавить
            </Button>
            {images.length > 0 && (
              <div className={styles.photoGrid}>
                {images.map((url) => (
                  <div key={url} className={styles.photoThumb}>
                    <ListingPhoto src={url} alt="" className={styles.photoImage} />
                    <button
                      type="button"
                      className={styles.photoRemove}
                      aria-label="Удалить"
                      onClick={() => setImages((prev) => prev.filter((item) => item !== url))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className={styles.footer}>
          <Button loading={saving} onClick={() => void handleSave()}>Сохранить</Button>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
        </footer>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

export {
  ListingModeratorEditSheet,
};
