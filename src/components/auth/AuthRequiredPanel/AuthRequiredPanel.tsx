import { memo } from 'react'
import { ButtonLink } from '@/components/ui/Button/ButtonLink'
import { ROUTES } from '@/constants'
import styles from './AuthRequiredPanel.module.css'

interface AuthRequiredPanelProps {
  title: string
  description?: string
}

const AuthRequiredPanel = memo(function AuthRequiredPanel({
  title,
  description,
}: AuthRequiredPanelProps) {
  return (
    <div className={styles.panel}>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      <ButtonLink to={ROUTES.AUTH} size="lg">
        Войти или зарегистрироваться
      </ButtonLink>
    </div>
  )
})

export {
  AuthRequiredPanel,
}
