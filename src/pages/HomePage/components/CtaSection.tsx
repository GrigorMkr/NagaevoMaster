import { memo } from 'react'
import { ButtonLink } from '@/components/ui/Button/ButtonLink'
import { ROUTES } from '@/constants'
import styles from '../HomePage.module.css'

export const CtaSection = memo(function CtaSection() {
  return (
    <div className={styles.callToActionSection}>
      <div className={styles.callToActionCard}>
        <div className={styles.callToActionContent}>
          <span className="badge">Для мастеров и бизнеса</span>
          <h2 className="titleSection">Разместите услугу в каталоге</h2>
          <p className={styles.callToActionText}>
            Добавьте объявление — мы поможем найти клиентов в Нагаево.
          </p>
        </div>
        <ButtonLink to={ROUTES.ADD_LISTING} size="lg">
          Добавить объявление
        </ButtonLink>
      </div>
    </div>
  )
})
