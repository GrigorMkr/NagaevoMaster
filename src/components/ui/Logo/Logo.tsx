import classNames from 'classnames';
import { LOGO_ICON_SIZE_COMPACT, LOGO_ICON_SIZE_DEFAULT } from '@/constants';
import { isLowPowerDevice } from '@/utils/performanceProfile';
import { LogoIcon } from './LogoIcon';
import styles from './Logo.module.css';

type LogoVariant = 'default' | 'footer' | 'icon' | 'hero' | 'stamp';

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
}

function Logo({ variant = 'default', className }: LogoProps) {
  const isIconOnly = variant === 'icon';
  const isFooter = variant === 'footer';
  const isHero = variant === 'hero';
  const isStamp = variant === 'stamp';
  const label = 'Нагаево Мастер';

  return (
    <span
      className={classNames(
        styles.logo,
        isFooter && styles.footer,
        isIconOnly && styles.iconOnly,
        isHero && styles.hero,
        isStamp && styles.stamp,
        className,
      )}
      role="img"
      aria-label={label}
    >
      <span className={styles.logomark}>
        <LogoIcon
          size={isHero ? 88 : isFooter ? LOGO_ICON_SIZE_COMPACT : LOGO_ICON_SIZE_DEFAULT}
          variant={isStamp ? 'stamp' : 'default'}
          chimneySmokeColor="#4dd0a0"
          animateChimneySmoke={isStamp && !isLowPowerDevice()}
          animatedText={!isStamp}
          ariaHidden
        />
      </span>
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
