import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppSelector } from '@/app/hooks'
import {
  selectAuthLoading,
  selectCanModerate,
  selectCurrentUser,
  selectIsAuthenticated,
} from '@/features/user/userSelectors'
import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { Button } from '@/components/ui/Button/Button'
import { ButtonLink } from '@/components/ui/Button/ButtonLink'
import { CompactListingRow } from '@/components/listings/CompactListingRow/CompactListingRow'
import { ProfileExpandableSection } from '@/components/profile/ProfileExpandableSection/ProfileExpandableSection'
import { ModerationDashboard } from '@/components/moderation/ModerationDashboard/ModerationDashboard'
import { FavoritesPanel } from '@/components/profile/FavoritesPanel/FavoritesPanel'
import { SocialPanel } from '@/components/profile/SocialPanel/SocialPanel'
import { MyReviewsPanel } from '@/components/profile/MyReviewsPanel/MyReviewsPanel'
import { NotificationsPanel } from '@/components/profile/NotificationsPanel/NotificationsPanel'
import { ProfileSettingsForm } from '@/components/profile/ProfileSettingsForm/ProfileSettingsForm'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar'
import { useMyListings } from '@/hooks/useMyListings'
import { fetchUnreadMessageCount } from '@/services/messagesApi'
import { resubmitListing } from '@/services/listingsApi'
import { buildAvatarUrl } from '@/utils/avatarUrl'
import { resolveUploadUrl } from '@/utils/mediaUrl'
import { ROUTES, editListingPath } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errorMessage'
import { showMessageLightning } from '@/utils/messageLightningToast'
import { useAuthLogout } from '@/hooks/useAuthLogout'
import { PushSetupGate } from '@/components/push/PushSetupGate/PushSetupGate'
import { Reveal } from '@/components/ui/Reveal/Reveal'
import pageStyles from '@/styles/page.module.css'
import styles from './ProfilePage.module.css'

function ProfilePage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAuthLoading = useAppSelector(selectAuthLoading)
  const currentUser = useAppSelector(selectCurrentUser)
  const canModerate = useAppSelector(selectCanModerate)
  const [searchParams, setSearchParams] = useSearchParams()
  const chatId = searchParams.get('chat')
  const withUserId = searchParams.get('with')
  const section = searchParams.get('section')
  const { listings: myListings, loading: listingsLoading, reload: reloadMyListings } = useMyListings(currentUser?.id)
  const [resubmittingId, setResubmittingId] = useState<string | null>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [flashUnread, setFlashUnread] = useState(false)
  const prevUnreadRef = useRef(0)
  const handleLogout = useAuthLogout()

  const handleUnreadChange = useCallback((count: number) => {
    if (count > prevUnreadRef.current && prevUnreadRef.current > 0) {
      setFlashUnread(true)
      showMessageLightning('Новое сообщение', 'Откройте переписку')
      window.setTimeout(() => setFlashUnread(false), 1200)
    }
    prevUnreadRef.current = count
    setUnreadMessages(count)
  }, [])

  const updateChatParam = useCallback((nextChatId: string | null) => {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      params.delete('with')
      params.set('section', 'messages')
      if (nextChatId) {
        params.set('chat', nextChatId)
      } else {
        params.delete('chat')
      }
      return params
    }, { replace: true })
  }, [setSearchParams])

  const openMessageWithUser = useCallback((userId: string) => {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      params.set('section', 'messages')
      params.delete('chat')
      params.set('with', userId)
      return params
    }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    if (!section && !chatId && !withUserId) {
      setSearchParams((current) => {
        const params = new URLSearchParams(current)
        params.set('section', 'messages')
        return params
      }, { replace: true })
    }
  }, [chatId, section, setSearchParams, withUserId])

  useEffect(() => {
    const isMessagesView = section === 'messages' || Boolean(chatId) || Boolean(withUserId)
    if (!isMessagesView) return undefined
    document.documentElement.classList.add('profile-messages-active')
    return () => {
      document.documentElement.classList.remove('profile-messages-active')
    }
  }, [chatId, section, withUserId])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0);
      return;
    }
    const loadUnread = () => {
      void fetchUnreadMessageCount()
        .then(handleUnreadChange)
        .catch(() => handleUnreadChange(0));
    };
    loadUnread();
    const timer = window.setInterval(loadUnread, 3000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, handleUnreadChange]);

  const handleResubmit = useCallback(async (listingId: string) => {
    setResubmittingId(listingId)
    try {
      await resubmitListing(listingId)
      toast.success('Объявление снова отправлено на модерацию')
      await reloadMyListings()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить объявление на модерацию'))
    } finally {
      setResubmittingId(null)
    }
  }, [reloadMyListings])

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

  const avatarSrc = currentUser.avatarUrl
    ? resolveUploadUrl(currentUser.avatarUrl)
    : buildAvatarUrl(currentUser.name, currentUser.email)

  return (
    <>
      <PageMeta title="Профиль" canonical="/profile" />

      <div className={pageStyles.page}>
        <div className="container">
          <header className={styles.profileIntro}>
            <UserAvatar name={currentUser.name} src={avatarSrc} size="lg" />
            <div className={styles.profileHeadline}>
              <p className={styles.profileBadge}>Профиль</p>
              <h1 className={styles.profileName}>{currentUser.name}</h1>
              <p className={styles.profileGreeting}>Сообщения и объявления в одном месте</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={styles.profileLogout}
                onClick={handleLogout}
              >
                Выйти из аккаунта
              </Button>
            </div>
            {unreadMessages > 0 && (
              <span className={`${styles.unreadPill} ${flashUnread ? styles.unreadPillFlash : ''}`}>
                ⚡ {unreadMessages} новых
              </span>
            )}
          </header>

          <Reveal delay={40}>
            <section className={styles.messagesHero} aria-label="Переписка">
              <div className={styles.messagesHeroHeader}>
                <h2 className={styles.messagesHeroTitle}>💬 Переписка</h2>
              </div>
              <PushSetupGate />
              <SocialPanel
                chatId={chatId}
                withUserId={withUserId}
                onChatChange={updateChatParam}
                onUnreadChange={handleUnreadChange}
                onMessageUser={openMessageWithUser}
              />
            </section>
          </Reveal>

          <Reveal delay={100}>
            <ProfileExpandableSection title="Настройки профиля">
              <ProfileSettingsForm user={currentUser} />
            </ProfileExpandableSection>

            {canModerate && <ModerationDashboard />}

            <ProfileExpandableSection
              title="Мои объявления"
              count={myListings.length}
              loading={listingsLoading}
            >
              {myListings.length === 0 ? (
                <p className={styles.emptyListings}>У вас пока нет объявлений</p>
              ) : (
                <div className={styles.listingsList}>
                  {myListings.map((listing) => (
                    <div key={listing.id} className={styles.listingItem}>
                      <CompactListingRow
                        listing={listing}
                        to={editListingPath(listing.id)}
                        showAuthor={false}
                        showArrow={false}
                      />
                      <div className={styles.listingActions}>
                        {listing.status === 'rejected' && (
                          <Button
                            type="button"
                            size="sm"
                            loading={resubmittingId === listing.id}
                            onClick={() => void handleResubmit(listing.id)}
                          >
                            Снова на модерацию
                          </Button>
                        )}
                        <ButtonLink to={editListingPath(listing.id)} size="sm" variant="outline">
                          Редактировать
                        </ButtonLink>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ProfileExpandableSection>

            <NotificationsPanel />
            <FavoritesPanel />
            <MyReviewsPanel />
          </Reveal>
        </div>
      </div>
    </>
  )
}

export {
  ProfilePage,
}
