import { memo } from 'react';
import { SERVICE_CATEGORIES } from '@/data/categories';
import { servicesCategoryPath } from '@/constants';
import { CategoryCard } from '@/components/categories/CategoryCard/CategoryCard';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';
const CategoriesSection = memo(function CategoriesSection() {
    return (<div className={styles.contentBlock}>
      <SectionHead badge="Каталог" title="Все категории"/>
      <div className={styles.categoryGrid}>
        {SERVICE_CATEGORIES.map((cat, i) => (<CategoryCard key={cat.slug} to={servicesCategoryPath(cat.slug)} icon={cat.icon} name={cat.name} variant="tile" style={{ animationDelay: `${i * 0.04}s` }}/>))}
      </div>
    </div>);
});

export {
  CategoriesSection,
}
