import { memo, useCallback, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import classNames from 'classnames';
import { ButtonLink } from '@/components/ui/Button/ButtonLink';
import { Logo } from '@/components/ui/Logo/Logo';
import { useAppSelector } from '@/app/hooks';
import { HEADER_NAV_ITEMS, ROUTES } from '@/constants';
import styles from './Header.module.css';
const Header = memo(function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const hasNotifications = useAppSelector((state) => state.ui.hasForumNotifications);
    const closeMenu = useCallback(() => setMenuOpen(false), []);
    const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
    return (<header className={styles.header}>
      <div className={classNames('container', styles.inner)}>
        <Link to={ROUTES.HOME} className={styles.logoLink} onClick={closeMenu}>
          <Logo />
        </Link>

        <button type="button" className={styles.menuToggle} onClick={toggleMenu} aria-expanded={menuOpen} aria-label="Меню навигации">
          <span />
          <span />
          <span />
        </button>

        <nav className={classNames(styles.nav, menuOpen && styles.navOpen)}>
          <ul className={styles.navList}>
            {HEADER_NAV_ITEMS.map((item) => (<li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => classNames(styles.navLink, isActive && styles.navLinkActive)} onClick={closeMenu} end={item.to === ROUTES.HOME}>
                  {item.label}
                </NavLink>
              </li>))}
            <li className={styles.navActionItem}>
              <ButtonLink to={ROUTES.ADD_LISTING} size="sm" variant="secondary" onClick={closeMenu}>
                + Объявление
              </ButtonLink>
            </li>
            <li className={styles.navActionItem}>
              <Link to={ROUTES.PROFILE} onClick={closeMenu} className={styles.profileLink}>
                Профиль
                {hasNotifications && (<span className={styles.notificationDot} aria-label="Уведомления"/>)}
              </Link>
            </li>
            <li className={styles.navActionItem}>
              <ButtonLink to={ROUTES.AUTH} size="sm" variant="outline" onClick={closeMenu}>
                Войти
              </ButtonLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>);
});

export {
  Header,
}
