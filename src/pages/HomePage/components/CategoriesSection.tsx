import { memo, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { SERVICE_CATEGORIES } from '@/data/categories'
import { CATEGORY_CARD_STYLE, servicesCategoryPath } from '@/constants'
import { SectionHead } from './SectionHead'
import styles from '../HomePage.module.css'

export const CategoriesSection = memo(function CategoriesSection() {
  return (
    <div className={styles.contentBlock}>
      <SectionHead badge="Каталог" title="Все категории" />
      <div className={styles.categoryGrid}>
        {SERVICE_CATEGORIES.map((cat, i) => (
          <Link
            key={cat.slug}
            to={servicesCategoryPath(cat.slug)}
            className={styles.categoryCard}
            style={
              {
                ...CATEGORY_CARD_STYLE,
                animationDelay: `${i * 0.04}s`,
              } as CSSProperties
            }
          >
            <span className={styles.categoryIcon}>{cat.icon}</span>
            <span className={styles.categoryName}>{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
})
