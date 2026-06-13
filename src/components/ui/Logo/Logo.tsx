import classNames from 'classnames';
import { LOGO_ICON_SIZE_COMPACT, LOGO_ICON_SIZE_DEFAULT } from '@/constants';
import { LogoIcon } from './LogoIcon';
import styles from './Logo.module.css';

type LogoVariant = 'default' | 'footer' | 'icon';

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
}

function Logo({ variant = 'default', className }: LogoProps) {
  const isIconOnly = variant === 'icon';
  const isFooter = variant === 'footer';
  const label = 'Нагаево Мастер';

  return (
    <span
      className={classNames(styles.logo, isFooter && styles.footer, isIconOnly && styles.iconOnly, className)}
      role="img"
      aria-label={label}
    >
      <LogoIcon
        size={isFooter ? LOGO_ICON_SIZE_COMPACT : LOGO_ICON_SIZE_DEFAULT}
        className={styles.logomark}
        ariaHidden
      />
      {!isIconOnly && (
        <span className={styles.wordmark} aria-hidden="true">
          <span className={styles.name}>Нагаево</span>
          <span className={styles.master}>Мастер</span>
        </span>
      )}
    </span>
  );
}

export {
  Logo,
}
