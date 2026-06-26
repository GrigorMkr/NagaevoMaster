import { NavLink } from 'react-router-dom';
import classNames from 'classnames';
import { ROUTES } from '@/constants';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import { isNativeApp } from '@/utils/nativeApp';
import styles from './NativeTabBar.module.css';

const TABS = [
  { to: ROUTES.HOME, label: 'Главная', glyph: '⌂', end: true },
  { to: ROUTES.SERVICES, label: 'Услуги', glyph: '◆' },
  { to: ROUTES.BOARD, label: 'Доска', glyph: '▤' },
  { to: ROUTES.SEARCH, label: 'Поиск', glyph: '◎', featured: true },
  { to: ROUTES.FORUM, label: 'Форум', glyph: '✦' },
  { to: ROUTES.PROFILE, label: 'Профиль', glyph: '●', authFallback: ROUTES.AUTH },
] as const;

function NativeTabBar() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isNativeApp()) {
    return null;
  }

  return (
    <nav className={`${styles.dock} native-tab-bar`} aria-label="Навигация приложения">
      <div className={styles.glow} aria-hidden />
      <div className={styles.inner}>
        {TABS.map((tab) => {
          const to = 'authFallback' in tab && !isAuthenticated ? tab.authFallback : tab.to;
          const featured = 'featured' in tab && tab.featured;

          return (
            <NavLink
              key={tab.to}
              to={to}
              end={'end' in tab ? tab.end : undefined}
              className={({ isActive }) =>
                classNames(
                  styles.tab,
                  featured && styles.tabFeatured,
                  isActive && styles.tabActive,
                )
              }
            >
              <span className={styles.glyph} aria-hidden>{tab.glyph}</span>
              <span className={styles.label}>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export {
  NativeTabBar,
};
