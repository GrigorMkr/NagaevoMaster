import { memo, useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button/Button';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { HERO_SUBTITLE, searchPath } from '@/constants';
import { savePendingSearchQuery } from '@/constants/user-location';
import { HeroStamp } from './HeroStamp';
import styles from '../HomePage.module.css';

const HeroSection = memo(function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    savePendingSearchQuery(searchQuery);
    navigate(searchPath(searchQuery));
  }, [navigate, searchQuery]);

  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
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
              <input
                id="hero-search"
                name="search"
                type="search"
                required
                placeholder="Ремонт, трактор, электрик..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="md">
                Найти
              </Button>
            </div>
          </form>

          <HeroStamp />
        </div>
      </div>
    </section>
  );
});

export {
  HeroSection,
}
