import { memo } from 'react'
import styles from '../HomePage.module.css'

interface SectionHeadProps {
  badge: string
  title: string
  description?: string
}

export const SectionHead = memo(function SectionHead({
  badge,
  title,
  description,
}: SectionHeadProps) {
  return (
    <div className={styles.sectionHead}>
      <span className="badge">{badge}</span>
      <h2 className="titleSection">{title}</h2>
      {description && <p className={styles.sectionDesc}>{description}</p>}
    </div>
  )
})
