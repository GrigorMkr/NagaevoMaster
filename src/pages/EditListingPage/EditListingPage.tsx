import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser, selectIsAuthenticated, selectAuthLoading } from '@/features/user/userSelectors';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import { ListingStatusBadge } from '@/components/listings/ListingStatusBadge/ListingStatusBadge';
import { ListingTermsAgreement } from '@/components/listings/ListingTermsAgreement/ListingTermsAgreement';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import { SERVICE_CATEGORIES } from '@/data/categories';
import { NAGAEVO_CENTER } from '@/constants/geo-data';
import { validateUserContent } from '@/constants/communityRules';
import { fetchMyListings, updateListing, uploadListingImage } from '@/services/listingsApi';
import type { Listing, PriceUnit } from '@/types/listing';
import { ROUTES } from '@/utils/constants';
import pageStyles from '@/styles/page.module.css';
import addStyles from '../AddListingPage/AddListingPage.module.css';
import styles from './EditListingPage.module.css';

const UNITS: PriceUnit[] = ['час', 'день', 'м²', 'услуга', 'шт'];
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const currentUser = useAppSelector(selectCurrentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [unit, setUnit] = useState<PriceUnit>('услуга');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('п. Нагаево');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!id || !currentUser) return;
    setLoading(true);
    fetchMyListings(currentUser.id)
      .then((items) => {
        const item = items.find((entry) => entry.id === id) ?? null;
        if (!item) {
          setListing(null);
          return;
        }
        setListing(item);
        setCategory(item.category);
        setSubcategory(item.subcategory);
        setTitle(item.title);
        setDescription(item.description);
        setPriceFrom(String(item.priceFrom));
        setUnit(item.unit);
        setPhone(item.phone);
        setAddress(item.location.address);
        setImageUrls(item.images);
      })
      .finally(() => setLoading(false));
  }, [id, currentUser]);

  const selectedCat = useMemo(
    () => SERVICE_CATEGORIES.find((cat) => cat.slug === category),
    [category],
  );

  if (isAuthLoading) {
    return (
      <div className={pageStyles.page}>
        <div className="container"><Spinner /></div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <div className="container"><Spinner /></div>
      </div>
    );
  }

  if (!listing || !id) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <p>Объявление не найдено</p>
          <Button variant="outline" onClick={() => navigate(ROUTES.PROFILE)}>В профиль</Button>
        </div>
      </div>
    );
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageUrls.length >= MAX_PHOTOS) {
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
      setImageUrls((prev) => [...prev, url]);
      toast.success('Фото добавлено');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!termsAccepted) {
      toast.error('Подтвердите согласие с условиями размещения');
      return;
    }
    const contentError = validateUserContent(title, description);
    if (contentError) {
      toast.error(contentError);
      return;
    }
    if (title.trim().length < 3 || description.trim().length < 10 || Number(priceFrom) <= 0) {
      toast.error('Заполните название, описание и цену');
      return;
    }
    setSaving(true);
    try {
      await updateListing(id, {
        category,
        subcategory,
        title: title.trim(),
        description: description.trim(),
        priceFrom: Number(priceFrom),
        unit,
        phone: phone.trim(),
        location: { ...NAGAEVO_CENTER, address: address.trim() },
        imageIds: imageUrls,
      });
      toast.success('Сохранено и отправлено на модерацию');
      navigate(ROUTES.PROFILE);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Редактирование объявления" canonical={`/edit-listing/${id}`} />
      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Кабинет" title="Редактирование" />

          <Reveal delay={80}>
            <div className={styles.layout}>
              <div className={styles.panel}>
                <div className={styles.statusRow}>
                  <ListingStatusBadge status={listing.status} />
                </div>

                <section className={styles.section} aria-labelledby="edit-category">
                  <h2 id="edit-category" className={styles.sectionTitle}>Категория</h2>
                  <div className={addStyles.formRow}>
                    <label className={addStyles.field}>
                      <span>Раздел</span>
                      <select
                        className={styles.softSelect}
                        value={category}
                        onChange={(event) => {
                          setCategory(event.target.value);
                          setSubcategory('');
                        }}
                      >
                        {SERVICE_CATEGORIES.map((cat) => (
                          <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className={addStyles.field}>
                      <span>Тип услуги</span>
                      <select
                        className={styles.softSelect}
                        value={subcategory}
                        onChange={(event) => setSubcategory(event.target.value)}
                      >
                        {selectedCat?.subcategories.map((sub) => (
                          <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className={styles.section} aria-labelledby="edit-description">
                  <h2 id="edit-description" className={styles.sectionTitle}>Описание</h2>
                  <div className={addStyles.formStack}>
                    <label className={addStyles.field}>
                      <span>Заголовок</span>
                      <input
                        className={styles.softInput}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Например: Ремонт крыш и фасадов"
                      />
                    </label>
                    <label className={addStyles.field}>
                      <span>Текст объявления</span>
                      <textarea
                        className={styles.softTextarea}
                        rows={5}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Опишите услугу, опыт и условия"
                      />
                    </label>
                    <div className={addStyles.formRow}>
                      <label className={addStyles.field}>
                        <span>Цена от, ₽</span>
                        <input
                          className={styles.softInput}
                          type="number"
                          min={1}
                          value={priceFrom}
                          onChange={(event) => setPriceFrom(event.target.value)}
                        />
                      </label>
                      <label className={addStyles.field}>
                        <span>Единица</span>
                        <select
                          className={styles.softSelect}
                          value={unit}
                          onChange={(event) => setUnit(event.target.value as PriceUnit)}
                        >
                          {UNITS.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </section>

                <section className={styles.section} aria-labelledby="edit-contacts">
                  <h2 id="edit-contacts" className={styles.sectionTitle}>Контакты</h2>
                  <div className={addStyles.formRow}>
                    <label className={addStyles.field}>
                      <span>Телефон</span>
                      <input
                        className={styles.softInput}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+7 ..."
                      />
                    </label>
                    <label className={addStyles.field}>
                      <span>Район</span>
                      <input
                        className={styles.softInput}
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className={styles.section} aria-labelledby="edit-photos">
                  <h2 id="edit-photos" className={styles.sectionTitle}>Фото</h2>
                  <div className={styles.upload}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlePhotoUpload}
                    />
                    <p className={styles.uploadHint}>До {MAX_PHOTOS} фото, до 2 МБ каждое</p>
                    <Button
                      type="button"
                      variant="outline"
                      loading={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Добавить фото
                    </Button>
                    {imageUrls.length > 0 && (
                      <div className={addStyles.photoGrid}>
                        {imageUrls.map((url) => (
                          <div key={url} className={addStyles.photoThumb}>
                            <ListingPhoto src={url} alt="" className={addStyles.photoImage} />
                            <button
                              type="button"
                              className={addStyles.photoRemove}
                              aria-label="Удалить фото"
                              onClick={() => setImageUrls((prev) => prev.filter((item) => item !== url))}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <footer className={styles.footer}>
                  <ListingTermsAgreement checked={termsAccepted} onChange={setTermsAccepted} />
                  <div className={styles.actions}>
                    <Button
                      onClick={() => void handleSave()}
                      loading={saving}
                      disabled={!termsAccepted}
                    >
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={() => navigate(ROUTES.PROFILE)}>
                      Отмена
                    </Button>
                  </div>
                </footer>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}

export {
  EditListingPage,
};
