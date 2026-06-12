import { memo } from 'react'
import { Link } from 'react-router-dom'
import { POPULAR_SERVICES } from '@/data/mockListings'
import { searchPath } from '@/constants'
import { SectionHead } from './SectionHead'
import styles from '../HomePage.module.css'

export const PopularServicesSection = memo(function PopularServicesSection() {
  return (
    <div className={styles.contentBlock}>
      <SectionHead badge="Популярно" title="16 популярных услуг" />
      <div className={styles.popularGrid}>
        {POPULAR_SERVICES.map((item) => (
          <Link key={item.id} to={searchPath(item.title)} className={styles.popularCard}>
            <span className={styles.popularIcon}>{item.icon}</span>
            <span className={styles.popularTitle}>{item.title}</span>
            <span className={styles.popularCount}>{item.count} мастеров</span>
          </Link>
        ))}
      </div>
    </div>
  )
})
