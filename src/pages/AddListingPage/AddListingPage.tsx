import { useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser, selectIsAuthenticated, selectAuthLoading } from '@/features/user/userSelectors';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { ListingTermsAgreement } from '@/components/listings/ListingTermsAgreement/ListingTermsAgreement';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import { SERVICE_CATEGORIES } from '@/data/categories';
import { getCategoryCover } from '@/data/mock/listingImages';
import { NAGAEVO_CENTER } from '@/constants/geo-data';
import { validateUserContent } from '@/constants/communityRules';
import { createListing, uploadListingImage } from '@/services/listingsApi';
import type { Listing, PriceUnit } from '@/types/listing';
import { ROUTES } from '@/utils/constants';
import { buildAvatarUrl } from '@/utils/avatarUrl';
import pageStyles from '@/styles/page.module.css';
import styles from './AddListingPage.module.css';

const STEPS = ['Категория', 'Подкатегория', 'Описание', 'Фото', 'Предпросмотр', 'Публикация'] as const;
const UNITS: PriceUnit[] = ['час', 'день', 'м²', 'услуга', 'шт'];
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

interface FormState {
  category: string;
  subcategory: string;
  title: string;
  description: string;
  priceFrom: string;
  unit: PriceUnit;
  phone: string;
  address: string;
  imageUrls: string[];
}

const INITIAL_FORM: FormState = {
  category: '',
  subcategory: '',
  title: '',
  description: '',
  priceFrom: '',
  unit: 'услуга',
  phone: '',
  address: 'п. Нагаево',
  imageUrls: [],
};

function canProceed(step: number, form: FormState): boolean {
  if (step === 0) return Boolean(form.category);
  if (step === 1) return Boolean(form.subcategory);
  if (step === 2) {
    return (
      form.title.trim().length >= 3 &&
      form.description.trim().length >= 10 &&
      Number(form.priceFrom) > 0 &&
      form.phone.trim().length >= 10 &&
      form.address.trim().length >= 3
    );
  }
  return true;
}

function buildPreviewListing(form: FormState, user: NonNullable<ReturnType<typeof selectCurrentUser>>): Listing {
  return {
    id: 'preview',
    userId: user.id,
    title: form.title.trim(),
    category: form.category,
    subcategory: form.subcategory,
    description: form.description.trim(),
    priceFrom: Number(form.priceFrom) || 0,
    unit: form.unit,
    rating: 0,
    reviewsCount: 0,
    images: form.imageUrls,
    location: { ...NAGAEVO_CENTER, address: form.address.trim() },
    phone: form.phone.trim(),
    isVerified: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: user.id,
      name: user.name,
      login: user.email.split('@')[0] ?? user.id,
      avatarUrl: user.avatarUrl ?? buildAvatarUrl(user.name, user.email),
    },
  };
}

function AddListingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const currentUser = useAppSelector(selectCurrentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_FORM,
    phone: currentUser?.phone ?? '',
  }));
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const selectedCat = useMemo(
    () => SERVICE_CATEGORIES.find((c) => c.slug === form.category),
    [form.category],
  );

  const previewListing = useMemo(
    () => (currentUser ? buildPreviewListing(form, currentUser) : null),
    [form, currentUser],
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

  const patch = (partial: Partial<FormState>) => setForm((prev) => ({ ...prev, ...partial }));

  const handlePhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_PHOTOS - form.imageUrls.length;
    if (remaining <= 0) {
      toast.error(`Не больше ${MAX_PHOTOS} фото`);
      return;
    }
    const batch = Array.from(files).slice(0, remaining);
    for (const file of batch) {
      if (!file.type.startsWith('image/')) {
        toast.error('Только изображения');
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        toast.error('Файл больше 2 МБ');
        return;
      }
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of batch) {
        urls.push(await uploadListingImage(file));
      }
      patch({ imageUrls: [...form.imageUrls, ...urls] });
      toast.success(urls.length > 1 ? 'Фото загружены' : 'Фото загружено');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!termsAccepted) {
      toast.error('Подтвердите согласие с условиями размещения');
      return;
    }
    if (!canProceed(2, form)) {
      toast.error('Заполните описание и цену');
      setStep(2);
      return;
    }
    setPublishing(true);
    try {
      const contentError = validateUserContent(form.title, form.description);
      if (contentError) {
        toast.error(contentError);
        return;
      }
      await createListing({
        category: form.category,
        subcategory: form.subcategory,
        title: form.title.trim(),
        description: form.description.trim(),
        priceFrom: Number(form.priceFrom),
        unit: form.unit,
        phone: form.phone.trim(),
        location: { ...NAGAEVO_CENTER, address: form.address.trim() },
        imageIds: form.imageUrls,
      });
      toast.success('Объявление отправлено на модерацию');
      navigate(ROUTES.PROFILE);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось опубликовать');
    } finally {
      setPublishing(false);
    }
  };

  const nextDisabled = !canProceed(step, form) || uploading;

  return (
    <>
      <PageMeta title="Добавить объявление" canonical="/add-listing" />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Мастерам" title="Добавить объявление" />

          <Reveal delay={60}>
            <ol className={styles.steps}>
              {STEPS.map((label, i) => (
                <li key={label} className={i === step ? styles.stepActive : i < step ? styles.stepDone : ''}>
                  {i + 1}. {label}
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={100}>
            <div className={styles.panel} key={step}>
              {step === 0 && (
                <div className={`${styles.categoryGrid} motion-stagger`}>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      className={form.category === cat.slug ? styles.categoryButtonActive : styles.categoryButton}
                      onClick={() => patch({ category: cat.slug, subcategory: '' })}
                    >
                      <span className={styles.categoryThumb}>
                        <ListingPhoto className={styles.categoryThumbImage} src={getCategoryCover(cat.slug)} alt="" loading="lazy" />
                      </span>
                      <span className={styles.categoryName}>{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && selectedCat && (
                <div className={styles.subcategoryGrid}>
                  {selectedCat.subcategories.map((sub) => (
                    <button
                      key={sub.slug}
                      type="button"
                      className={form.subcategory === sub.slug ? styles.subcategoryActive : styles.subcategoryTag}
                      onClick={() => patch({ subcategory: sub.slug })}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className={styles.formStack}>
                  <label className={styles.field}>
                    <span>Заголовок</span>
                    <input
                      className={pageStyles.input}
                      value={form.title}
                      onChange={(e) => patch({ title: e.target.value })}
                      placeholder="Например: Ремонт крыш и фасадов"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Описание *</span>
                    <textarea
                      className={styles.textarea}
                      rows={6}
                      value={form.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      placeholder="Опишите услугу, опыт, условия и цены..."
                      aria-label="Описание"
                    />
                    {form.description.trim().length > 0 && form.description.trim().length < 10 && (
                      <span className={pageStyles.formError}>Минимум 10 символов</span>
                    )}
                  </label>
                  <div className={styles.formRow}>
                    <label className={styles.field}>
                      <span>Цена от, ₽</span>
                      <input
                        className={pageStyles.input}
                        type="number"
                        min={1}
                        value={form.priceFrom}
                        onChange={(e) => patch({ priceFrom: e.target.value })}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Единица</span>
                      <select
                        className={styles.select}
                        value={form.unit}
                        onChange={(e) => patch({ unit: e.target.value as PriceUnit })}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className={styles.field}>
                    <span>Телефон</span>
                    <input
                      className={pageStyles.input}
                      value={form.phone}
                      onChange={(e) => patch({ phone: e.target.value })}
                      placeholder="+7 ..."
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Адрес / район</span>
                    <input
                      className={pageStyles.input}
                      value={form.address}
                      onChange={(e) => patch({ address: e.target.value })}
                    />
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className={styles.upload}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className={styles.fileInput}
                    onChange={(e) => void handlePhotos(e.target.files)}
                  />
                  <p>До {MAX_PHOTOS} фото, каждое не больше 2 МБ</p>
                  <Button type="button" variant="outline" loading={uploading} onClick={() => fileInputRef.current?.click()}>
                    Выбрать фото
                  </Button>
                  {form.imageUrls.length > 0 && (
                    <div className={styles.photoGrid}>
                      {form.imageUrls.map((url) => (
                        <div key={url} className={styles.photoThumb}>
                          <ListingPhoto src={url} alt="" className={styles.photoImage} />
                          <button
                            type="button"
                            className={styles.photoRemove}
                            aria-label="Удалить фото"
                            onClick={() => patch({ imageUrls: form.imageUrls.filter((u) => u !== url) })}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 4 && previewListing && (
                <div className={styles.previewBlock}>
                  <ListingCard listing={previewListing} preview />
                  <div className={styles.editLinks}>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStep(0)}>Категория</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)}>Подкатегория</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStep(2)}>Описание</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStep(3)}>Фото</Button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className={styles.publishInfo}>
                  <ListingTermsAgreement checked={termsAccepted} onChange={setTermsAccepted} />
                  <p>После нажатия «Отправить» объявление получит статус <strong>На модерации</strong>.</p>
                  <p>Администратор проверит текст и фото, затем опубликует или отклонит. Вы увидите статус в личном кабинете.</p>
                  <ul>
                    <li>Категория: {selectedCat?.name}</li>
                    <li>Подкатегория: {selectedCat?.subcategories.find((s) => s.slug === form.subcategory)?.name}</li>
                    <li>Фото: {form.imageUrls.length || 'без фото'}</li>
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.nav}>
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Назад</Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={nextDisabled}>Далее</Button>
              ) : (
                <Button
                  onClick={() => void handlePublish()}
                  loading={publishing}
                  disabled={!termsAccepted}
                >
                  Отправить на модерацию
                </Button>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}

export {
  AddListingPage,
}
