import classNames from 'classnames'
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
      <LogoIcon size={isFooter ? 40 : 44} className={styles.mark} ariaHidden={!isIconOnly} />
      {!isIconOnly && (
        <span className={styles.wordmark}>
          <span className={styles.name}>Nagaevo</span>
          <span className={styles.master}>Master</span>
        </span>
      )}
    </span>
  )
}
