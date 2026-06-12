import classNames from 'classnames'
import { LOGO_ICON_SIZE_COMPACT, LOGO_ICON_SIZE_DEFAULT } from '@/constants'
import { LogoIcon } from './LogoIcon'
import styles from './Logo.module.css'

type LogoVariant = 'default' | 'footer' | 'icon'

interface LogoProps {
  variant?: LogoVariant
  className?: string
}

export function Logo({ variant = 'default', className }: LogoProps) {
  const isIconOnly = variant === 'icon'
  const isFooter = variant === 'footer'

  return (
    <span
      className={classNames(
        styles.logo,
        isFooter && styles.footer,
        isIconOnly && styles.iconOnly,
        className,
      )}
      role={isIconOnly ? 'img' : undefined}
      aria-label={isIconOnly ? 'NagaevoMaster' : undefined}
    >
      <LogoIcon
        size={isFooter ? LOGO_ICON_SIZE_COMPACT : LOGO_ICON_SIZE_DEFAULT}
        className={styles.logomark}
        ariaHidden={!isIconOnly}
      />
      {!isIconOnly && (
        <span className={styles.wordmark}>
          <span className={styles.name}>Nagaevo</span>
          <span className={styles.master}>Master</span>
        </span>
      )}
    </span>
  )
}
