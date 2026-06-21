import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { fetchUserPublicProfile } from '@/services/usersApi';
import { serviceDetailPath } from '@/utils/constants';
import { resolveAuthorAvatar } from '@/utils/resolveAuthorAvatar';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './FriendProfileSheet.module.css';

interface FriendProfileSheetProps {
  userId: string | null;
  onClose: () => void;
}

function FriendProfileSheet({ userId, onClose }: FriendProfileSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchUserPublicProfile>> | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchUserPublicProfile(userId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Не удалось загрузить профиль'));
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return null;

  const avatar = profile
    ? resolveAuthorAvatar(profile.user.name, profile.user.login, profile.user.avatarUrl)
    : undefined;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          ×
        </button>

        {loading ? (
          <div className={styles.center}><Spinner /></div>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : profile ? (
          <>
            <div className={styles.hero}>
              <UserAvatar name={profile.user.name} src={avatar} size="lg" />
              <div>
                <h3 className={styles.name}>{profile.user.name}</h3>
                <p className={styles.login}>@{profile.user.login}</p>
              </div>
            </div>

            <h4 className={styles.sectionTitle}>
              Объявления ({profile.listings.length})
            </h4>
            {profile.listings.length === 0 ? (
              <p className={styles.empty}>Пока нет опубликованных объявлений</p>
            ) : (
              <ul className={styles.listings}>
                {profile.listings.map((listing) => (
                  <li key={listing.id}>
                    <Link className={styles.listingLink} to={serviceDetailPath(listing.id)} onClick={onClose}>
                      <span className={styles.listingTitle}>{listing.title}</span>
                      <span className={styles.listingPrice}>от {listing.priceFrom} ₽</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export {
  FriendProfileSheet,
};
