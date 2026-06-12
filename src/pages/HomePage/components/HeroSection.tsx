import { memo, useCallback, useMemo, useState, type FormEvent } from 'react';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button/Button';
import { ButtonLink } from '@/components/ui/Button/ButtonLink';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { GEO, HERO_SUBTITLE, ROUTES, searchPath } from '@/constants';
import { MOCK_LISTINGS } from '@/data/mockListings';
import styles from '../HomePage.module.css';
const HeroSection = memo(function HeroSection() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const stats = useMemo(() => [
        { value: `${MOCK_LISTINGS.length}+`, label: 'мастеров' },
        { value: `${GEO.radiusKm} км`, label: 'радиус' },
        { value: '9', label: 'категорий' },
    ], []);
    const handleSearch = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        navigate(searchPath(searchQuery));
    }, [navigate, searchQuery]);
    return (<section className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
          <span className={classNames('badge', 'badgeGold', styles.heroBadge)}>
            <span className={styles.heroBadgeDot}/>
            Посёлок {GEO.settlement}
          </span>

          <h1 className={styles.heroTitle}>
            Все услуги{' '}
            <span className={styles.heroTitleAccent}>поселка Нагаево</span>
          </h1>

          <p className={styles.heroText}>{HERO_SUBTITLE}</p>

          <form className={styles.heroSearch} action={ECHO_FORM_ACTION} method="get" onSubmit={handleSearch}>
            <div className={styles.heroSearchInner}>
              <span className={styles.heroSearchIcon}>⌕</span>
              <label className="sr-only" htmlFor="hero-search">
                Поиск услуг
              </label>
              <input id="hero-search" name="search" type="search" required placeholder="Ремонт, трактор, электрик..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
              <Button type="submit" size="md">
                Найти
              </Button>
            </div>
          </form>

          <div className={styles.heroActions}>
            <ButtonLink to={ROUTES.SERVICES} size="lg">
              Каталог услуг
            </ButtonLink>
            <ButtonLink to={ROUTES.FORUM} size="lg" variant="outline">
              Форум жителей
            </ButtonLink>
          </div>

          <ul className={styles.heroStats}>
            {stats.map((stat) => (<li key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </li>))}
          </ul>
        </div>
      </div>
    </section>);
});

export {
  HeroSection,
}
