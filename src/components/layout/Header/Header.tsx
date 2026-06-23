import { memo, useCallback, useEffect, useState } from 'react'

import { Link, NavLink } from 'react-router-dom'

import classNames from 'classnames'

import { ButtonLink } from '@/components/ui/Button/ButtonLink'

import { Button } from '@/components/ui/Button/Button'

import { Logo } from '@/components/ui/Logo/Logo'

import { useAppSelector } from '@/app/hooks'

import { selectIsAuthenticated, selectCurrentUser } from '@/features/user/userSelectors'

import { HEADER_NAV_ITEMS, ROUTES, profileMessagesPath } from '@/constants'

import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar'

import { buildAvatarUrl } from '@/utils/avatarUrl'

import { resolveUploadUrl } from '@/utils/mediaUrl'

import { fetchUnreadMessageCount } from '@/services/messagesApi'
import { useAuthLogout } from '@/hooks/useAuthLogout'
import { useMobileLayout } from '@/hooks/useMobileLayout'
import { isNativeApp } from '@/utils/nativeApp'

import styles from './Header.module.css'



const Header = memo(function Header() {

  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const handleLogout = useAuthLogout()

  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  const currentUser = useAppSelector(selectCurrentUser)

  const nativeApp = isNativeApp()
  const mobileLayout = useMobileLayout()

  const hasNotifications = useAppSelector((state) => state.ui.hasForumNotifications)

  const avatarSrc = currentUser?.avatarUrl

    ? resolveUploadUrl(currentUser.avatarUrl)

    : currentUser

      ? buildAvatarUrl(currentUser.name, currentUser.email)

      : undefined



  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [])

  const onLogout = useCallback(() => {
    handleLogout()
    closeMenu()
  }, [closeMenu, handleLogout])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0)
      return
    }
    const loadUnread = () => {
      void fetchUnreadMessageCount()
        .then(setUnreadMessages)
        .catch(() => setUnreadMessages(0))
    }
    loadUnread()
    const timer = window.setInterval(loadUnread, 3000)
    return () => window.clearInterval(timer)
  }, [isAuthenticated])

  return (

    <header className={classNames(styles.header, 'site-header', nativeApp && styles.headerNative)}>

      {!nativeApp && menuOpen && (

        <button

          type="button"

          className={styles.menuBackdrop}

          onClick={closeMenu}

          aria-label="Закрыть меню"

        />

      )}



      <div className={classNames('container', styles.inner)}>

        <Link to={ROUTES.HOME} className={styles.logoLink} onClick={closeMenu}>

          <Logo variant={nativeApp || mobileLayout ? 'stamp' : 'default'} />

        </Link>

        {nativeApp ? (
          <div className={styles.nativeActions}>
            {isAuthenticated ? (
              <>
                <Link to={profileMessagesPath()} className={styles.profileLink} onClick={closeMenu}>
                  {currentUser && (
                    <UserAvatar name={currentUser.name} src={avatarSrc} size="xs" />
                  )}
                  <span>Профиль</span>
                  {unreadMessages > 0 && (
                    <span className={styles.messageBadge}>{unreadMessages}</span>
                  )}
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={styles.logoutButton}
                  onClick={onLogout}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <ButtonLink to={ROUTES.AUTH} size="sm" variant="outline">
                Войти
              </ButtonLink>
            )}
          </div>
        ) : (
          <>
        <button

          type="button"

          className={styles.menuToggle}

          onClick={toggleMenu}

          aria-expanded={menuOpen}

          aria-label="Меню навигации"

        >

          <span />

          <span />

          <span />

        </button>



        <nav className={classNames(styles.nav, menuOpen && styles.navOpen)}>

          <ul className={styles.navList}>

            {HEADER_NAV_ITEMS.map((item) => (

              <li key={item.to}>

                <NavLink

                  to={item.to}

                  className={({ isActive }) =>

                    classNames(styles.navLink, isActive && styles.navLinkActive)

                  }

                  onClick={closeMenu}

                  end={item.to === ROUTES.HOME}

                >

                  {item.label}

                </NavLink>

              </li>

            ))}

            {isAuthenticated && (

              <li className={styles.navActionItem}>

                <ButtonLink

                  to={ROUTES.ADD_LISTING}

                  size="sm"

                  variant="secondary"

                  onClick={closeMenu}

                >

                  + Объявление

                </ButtonLink>

              </li>

            )}

            <li className={styles.navActionItem}>

              {isAuthenticated ? (

                <div className={styles.profileGroup}>

                  <Link to={profileMessagesPath()} onClick={closeMenu} className={styles.profileLink}>

                    {currentUser && (

                      <UserAvatar name={currentUser.name} src={avatarSrc} size="xs" />

                    )}

                    <span>Профиль</span>

                    {unreadMessages > 0 && (
                      <span className={styles.messageBadge}>{unreadMessages}</span>
                    )}

                    {hasNotifications && (

                      <span className={styles.notificationDot} aria-label="Уведомления" />

                    )}

                  </Link>

                  <Button

                    type="button"

                    size="sm"

                    variant="outline"

                    className={styles.logoutButton}

                    onClick={onLogout}

                  >

                    Выйти

                  </Button>

                </div>

              ) : (

                <ButtonLink to={ROUTES.AUTH} size="sm" variant="outline" onClick={closeMenu}>

                  Войти

                </ButtonLink>

              )}

            </li>

          </ul>

        </nav>
          </>
        )}

      </div>

    </header>

  )

})



export {

  Header,

}


