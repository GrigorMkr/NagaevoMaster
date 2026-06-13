import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/user/userSlice'
import {
  selectAuthLoading,
  selectCurrentUser,
  selectIsAuthenticated,
} from '@/features/user/userSelectors'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { PageHeader } from '@/components/ui/PageHeader/PageHeader'
import { Button } from '@/components/ui/Button/Button'
import { ButtonLink } from '@/components/ui/Button/ButtonLink'
import { ListingCard } from '@/components/listings/ListingCard/ListingCard'
import { ProfileSettingsForm } from '@/components/profile/ProfileSettingsForm/ProfileSettingsForm'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar'
import { useAccountLocation } from '@/hooks/useAccountLocation'
import { useMyListings } from '@/hooks/useMyListings'
import { clearAuthToken } from '@/services/authApi'
import { buildAvatarUrl } from '@/utils/avatarUrl'
import { ROUTES } from '@/utils/constants'
import { Reveal } from '@/components/ui/Reveal/Reveal'
import pageStyles from '@/styles/page.module.css'
import styles from './ProfilePage.module.css'

const otherSections = [
  { title: 'Мои отзывы', desc: 'Комментарии к услугам мастеров' },
  { title: 'Избранное', desc: 'Сохранённые услуги' },
  { title: 'Уведомления', desc: 'Ответы на форуме и модерация' },
] as const

function ProfilePage() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAuthLoading = useAppSelector(selectAuthLoading)
  const currentUser = useAppSelector(selectCurrentUser)
  const { accountLocation, isLocating, detectLocation, resetLocation } = useAccountLocation()
  const { listings: myListings, loading: listingsLoading } = useMyListings(currentUser?.id)

  const handleLogout = () => {
    clearAuthToken()
    dispatch(logout())
    toast.success('Вы вышли из аккаунта')
  }

  if (isAuthLoading) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to={ROUTES.AUTH} replace />
  }

  const avatarSrc = currentUser.avatarUrl ?? buildAvatarUrl(currentUser.name, currentUser.email)

  return (
    <>
      <PageMeta title="Личный кабинет" canonical="/profile" />

      <div className={pageStyles.page}>
        <div className="container">
          <div className={styles.profileIntro}>
            <UserAvatar name={currentUser.name} src={avatarSrc} size="lg" />
            <PageHeader
              badge="Профиль"
              title="Личный кабинет"
              subtitle={`Здравствуйте, ${currentUser.name}`}
            />
          </div>

          <Reveal delay={60}>
            <ProfileSettingsForm user={currentUser} />
          </Reveal>

          <Reveal delay={100}>
            <section className={styles.locationCard} aria-label="Местоположение аккаунта">
            <h2 className={styles.locationTitle}>Текущее местоположение</h2>
            {accountLocation ? (
              <p className={styles.locationText}>
                {accountLocation.label}: {accountLocation.lat.toFixed(5)},{' '}
                {accountLocation.lng.toFixed(5)}
              </p>
            ) : (
              <p className={styles.locationText}>
                Местоположение не задано. Оно нужно для поиска ближайших услуг на карте.
              </p>
            )}
            <div className={styles.locationActions}>
              <Button type="button" onClick={detectLocation} loading={isLocating}>
                Определить местоположение
              </Button>
              {accountLocation && (
                <Button type="button" variant="outline" onClick={resetLocation}>
                  Сбросить
                </Button>
              )}
            </div>
          </section>
          </Reveal>

          <Reveal delay={120}>
            <div className={styles.actions}>
              <ButtonLink to={ROUTES.ADD_LISTING}>Добавить объявление</ButtonLink>
              <Button type="button" variant="outline" onClick={handleLogout}>
                Выйти
              </Button>
            </div>

            <section className={styles.listingsSection} aria-labelledby="my-listings-title">
              <div className={styles.sectionHead}>
                <h2 id="my-listings-title" className={styles.sectionTitle}>
                  Мои объявления
                </h2>
                <p className={styles.sectionDesc}>
                  Управляйте своими услугами в каталоге посёлка
                </p>
              </div>

              {listingsLoading ? (
                <p className={styles.sectionStatus}>Загрузка объявлений…</p>
              ) : myListings.length > 0 ? (
                <div className={`${styles.listingsGrid} motion-stagger`}>
                  {myListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyListings}>
                  <p>У вас пока нет объявлений.</p>
                  <ButtonLink to={ROUTES.ADD_LISTING} size="sm">
                    Создать первое объявление
                  </ButtonLink>
                </div>
              )}
            </section>

            <div className={`${styles.grid} motion-stagger`}>
              {otherSections.map((section) => (
                <article key={section.title} className={styles.card}>
                  <h3>{section.title}</h3>
                  <p>{section.desc}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  )
}

export {
  ProfilePage,
}
