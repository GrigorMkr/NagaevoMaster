import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/features/user/userSlice';
import type { User } from '@/types/user';
import type { HomeLocation } from '@/types/location';
import { Button } from '@/components/ui/Button/Button';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { HomeAddressMap } from '@/components/profile/HomeAddressMap/HomeAddressMap';
import { AddressSearchField } from '@/components/location/AddressSearchField/AddressSearchField';
import { USE_MOCK_FALLBACK } from '@/config/runtime';
import { REGION_SETTLEMENTS } from '@/constants/geo-data';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { MAX_AVATAR_BYTES, resizeImageForAvatar } from '@/utils/resizeImage';
import { updateProfile } from '@/services/usersApi';
import { reverseGeocode } from '@/services/geoApi';
import { uploadImage } from '@/services/uploadsApi';
import { buildAvatarUrl } from '@/utils/avatarUrl';
import { resolveUploadUrl } from '@/utils/mediaUrl';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  formatBirthDateDisplay,
  maskBirthDateInput,
  parseBirthDateDisplay,
} from '@/utils/birthDate';
import { ensurePushNotifications, unsubscribeFromPush } from '@/services/pushApi';
import { isPushEnabledPreference, setPushEnabledPreference } from '@/utils/pushPreferences';
import { isPushApiAvailable } from '@/utils/pushEnvironment';
import pageStyles from '@/styles/page.module.css';
import styles from './ProfileSettingsForm.module.css';

interface ProfileSettingsFormProps {
  user: User;
}

function resolveAvatarDisplay(url: string): string {
  return resolveUploadUrl(url);
}

function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [birthDateInput, setBirthDateInput] = useState(formatBirthDateDisplay(user.birthDate));
  const [birthDateDirty, setBirthDateDirty] = useState(false);
  const [settlementId, setSettlementId] = useState<string>(REGION_SETTLEMENTS[0].id);
  const [addressQuery, setAddressQuery] = useState(user.homeLocation?.address ?? '');
  const [addressExtra, setAddressExtra] = useState('');
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(user.homeLocation ?? null);
  const [showAddressForm, setShowAddressForm] = useState(Boolean(user.homeLocation));
  const [avatarUrl, setAvatarUrl] = useState(
    user.avatarUrl ? resolveAvatarDisplay(user.avatarUrl) : buildAvatarUrl(user.name, user.email),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(isPushEnabledPreference);
  const [pushLoading, setPushLoading] = useState(false);
  const showPushToggle = isPushApiAvailable();
  const reverseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setBirthDateInput(formatBirthDateDisplay(user.birthDate));
    setBirthDateDirty(false);
  }, [user.id, user.birthDate]);

  const selectedSettlement = REGION_SETTLEMENTS.find((item) => item.id === settlementId)
    ?? REGION_SETTLEMENTS[0];

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const persistAvatar = async (nextAvatarUrl: string) => {
    const updatedUser = await updateProfile({ avatarUrl: nextAvatarUrl });
    dispatch(setUser(updatedUser));
    setAvatarUrl(updatedUser.avatarUrl
      ? resolveAvatarDisplay(updatedUser.avatarUrl)
      : buildAvatarUrl(updatedUser.name, updatedUser.email));
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const resized = await resizeImageForAvatar(file);
      let storedUrl: string;

      if (!USE_MOCK_FALLBACK) {
        const uploaded = await uploadImage(resized);
        storedUrl = uploaded.url;
      } else {
        const reader = new FileReader();
        storedUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
          reader.readAsDataURL(resized);
        });
      }

      await persistAvatar(storedUrl);
      toast.success('Аватар сохранён');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить аватар'));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const buildFullAddress = (base: string, extra: string): string => {
    const trimmedExtra = extra.trim();
    return trimmedExtra ? `${base}, ${trimmedExtra}` : base;
  };

  const resolveAddressFromMap = (lat: number, lng: number) => {
    if (reverseTimerRef.current) {
      window.clearTimeout(reverseTimerRef.current);
    }
    reverseTimerRef.current = window.setTimeout(() => {
      void reverseGeocode(lat, lng)
        .then((result) => {
          if (!result.label) {
            return;
          }
          setAddressQuery(result.label);
          setHomeLocation({
            lat: result.lat,
            lng: result.lng,
            address: buildFullAddress(result.label, addressExtra),
          });
        })
        .catch(() => undefined);
    }, 400);
  };

  const handlePushToggle = async (event: ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setPushEnabled(enabled);
    setPushEnabledPreference(enabled);
    setPushLoading(true);

    try {
      if (enabled) {
        const ok = await ensurePushNotifications({ requestPermission: true });
        if (!ok && Notification.permission === 'denied') {
          toast.error('Разрешите уведомления в настройках телефона');
        }
      } else {
        await unsubscribeFromPush();
        toast.success('Уведомления отключены');
      }
    } catch {
      toast.error('Не удалось изменить настройку');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const parsedBirthDate = birthDateInput.trim()
        ? parseBirthDateDisplay(birthDateInput)
        : null;

      if (birthDateInput.trim() && !parsedBirthDate) {
        toast.error('День рождения: формат дд.мм.гггг');
        return;
      }

      const nextHomeLocation = showAddressForm ? homeLocation : null;

      const updatedUser = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        ...(birthDateDirty
          ? { birthDate: parsedBirthDate }
          : {}),
        homeAddress: nextHomeLocation?.address ?? null,
        homeLat: nextHomeLocation?.lat ?? null,
        homeLng: nextHomeLocation?.lng ?? null,
      });
      dispatch(setUser(updatedUser));
      toast.success('Профиль сохранён');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сохранить профиль'));
    } finally {
      setIsSaving(false);
    }
  };

  const maxKb = Math.round(MAX_AVATAR_BYTES / 1024);

  return (
    <section className={styles.card} aria-labelledby="profile-settings-title">
      <h2 id="profile-settings-title" className={styles.title}>
        Настройки профиля
      </h2>
      <p className={styles.subtitle}>Аватар, контакты, день рождения и адрес</p>

      <form className={styles.form} action={ECHO_FORM_ACTION} method="post" onSubmit={handleSubmit}>
        <div className={styles.avatarRow}>
          <UserAvatar name={name} src={avatarUrl} size="lg" />
          <div className={styles.avatarActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAvatarPick} loading={isUploading}>
              Сменить аватар
            </Button>
            <p className={styles.hint}>JPG или PNG, до {maxKb} КБ после сжатия</p>
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
          <span>День рождения</span>
          <input
            className={pageStyles.input}
            type="text"
            inputMode="numeric"
            value={birthDateInput}
            onChange={(event) => {
              setBirthDateDirty(true);
              setBirthDateInput(maskBirthDateInput(event.target.value));
            }}
            placeholder="дд.мм.гггг"
            maxLength={10}
            autoComplete="bday"
          />
          <p className={styles.hint}>Формат: дд.мм.гггг. Друзья увидят только тортик в ваш день рождения, дату не показываем</p>
        </label>

        <label className={styles.field}>
          <span>Email</span>
          <input className={pageStyles.input} type="email" value={user.email} readOnly disabled />
          <p className={styles.hint}>Email меняется через поддержку</p>
        </label>

        <div className={styles.addressBlock}>
          <h3 className={styles.addressTitle}>Домашний адрес</h3>
          <p className={styles.hint}>
            Уфа, Нагаево и сёла в радиусе 50 км — поиск по улице и номеру дома
          </p>

          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={showAddressForm}
              onChange={(event) => {
                const enabled = event.target.checked;
                setShowAddressForm(enabled);
                if (!enabled) {
                  setHomeLocation(null);
                  setAddressQuery('');
                  setAddressExtra('');
                }
              }}
            />
            <span className={styles.toggleText}>
              <strong>Указать адрес</strong>
              <small>Друзья увидят на карте</small>
            </span>
          </label>

          {showAddressForm && (
            <>
              <label className={styles.field}>
                <span>Населённый пункт</span>
                <select
                  className={pageStyles.input}
                  value={settlementId}
                  onChange={(event) => setSettlementId(event.target.value)}
                >
                  {REGION_SETTLEMENTS.map((settlement) => (
                    <option key={settlement.id} value={settlement.id}>{settlement.label}</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>Улица и дом</span>
                <AddressSearchField
                  settlement={selectedSettlement.searchLabel}
                  near={{ lat: selectedSettlement.lat, lng: selectedSettlement.lng }}
                  value={addressQuery}
                  onChange={setAddressQuery}
                  onSelect={(result) => {
                    setAddressQuery(result.label);
                    setHomeLocation({
                      lat: result.lat,
                      lng: result.lng,
                      address: buildFullAddress(result.label, addressExtra),
                    });
                  }}
                />
              </label>

              <label className={styles.field}>
                <span>Уточнение</span>
                <input
                  className={pageStyles.input}
                  value={addressExtra}
                  onChange={(event) => {
                    const next = event.target.value;
                    setAddressExtra(next);
                    if (homeLocation) {
                      setHomeLocation({
                        ...homeLocation,
                        address: buildFullAddress(addressQuery, next),
                      });
                    }
                  }}
                  placeholder="квартира, подъезд, этаж"
                />
              </label>

              <HomeAddressMap
                location={homeLocation}
                mapCenter={[selectedSettlement.lat, selectedSettlement.lng]}
                onPick={(lat, lng) => {
                  setHomeLocation((current) => ({
                    lat,
                    lng,
                    address: current?.address ?? buildFullAddress(addressQuery, addressExtra),
                  }));
                }}
                onReverseGeocode={resolveAddressFromMap}
              />

            </>
          )}
        </div>

        {showPushToggle && (
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={pushEnabled}
              disabled={pushLoading}
              onChange={(event) => void handlePushToggle(event)}
            />
            <span className={styles.toggleText}>
              <strong>Уведомления: сообщения и друзья</strong>
              <small>Включены по умолчанию — снимите галочку, чтобы отключить</small>
            </span>
          </label>
        )}

        <Button type="submit" loading={isSaving}>
          Сохранить изменения
        </Button>
      </form>
    </section>
  );
}

export {
  ProfileSettingsForm,
};
