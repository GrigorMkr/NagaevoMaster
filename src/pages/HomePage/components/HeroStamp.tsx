import { memo, useCallback, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type SyntheticEvent } from 'react';
import classNames from 'classnames';
import { LogoIcon } from '@/components/ui/Logo/LogoIcon';
import { STAMP_SMOKE_PALETTE } from '@/data/stampSmokePalette';
import { usePrefersReducedMotion } from '@/hooks/useScrollRotation';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import styles from '../HomePage.module.css';

const ORBIT_DOTS = [0, 1, 2] as const;

const HeroStamp = memo(function HeroStamp() {
  const [tilt, setTilt] = useState({ rotate: 0, rotateX: 0, rotateY: 0, scale: 1 });
  const [smokeIndex, setSmokeIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { lowPower } = usePerformanceProfile();
  const smoke = STAMP_SMOKE_PALETTE[smokeIndex] ?? STAMP_SMOKE_PALETTE[0]!;
  const animateStamp = !reducedMotion;
  const enableTilt = !reducedMotion && !lowPower;

  const innerTransform = enableTilt
    ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) rotate(${tilt.rotate}deg) scale(${tilt.scale})`
    : undefined;

  const smokeStyle = {
    '--stamp-smoke-core': smoke.core,
    '--stamp-smoke-mid': smoke.mid,
    '--stamp-smoke-glow': smoke.glow,
  } as CSSProperties;

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!enableTilt) {
      return;
    }

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      rotate: x * 10 + y * 3,
      rotateX: -y * 16,
      rotateY: x * 16,
      scale: 1.05,
    });
  }, [enableTilt]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    setTilt({ rotate: 0, rotateX: 0, rotateY: 0, scale: 1 });
  }, []);

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const handleStampClick = useCallback((event: SyntheticEvent<HTMLDivElement>) => {
    setSmokeIndex((current) => (current + 1) % STAMP_SMOKE_PALETTE.length);
    event.currentTarget.blur();
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStampClick(event);
    }
  }, [handleStampClick]);

  return (
    <div
      className={classNames(
        styles.heroStampWrap,
        hovered && styles.heroStampWrapHovered,
        smokeIndex > 0 && styles.heroStampWrapTinted,
      )}
      style={smokeStyle}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleStampClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Печать Нагаево Мастер. Нажмите, чтобы сменить цвет свечения"
    >
      <div className={styles.heroStampSmokeBack} aria-hidden />
      <div className={styles.heroStampSmokeCore} aria-hidden />
      <div className={styles.heroStampSmokeFront} aria-hidden />
      <div className={styles.heroStampRing} />
      <div className={styles.heroStampRingSecondary} />
      <div className={styles.heroStampRingTertiary} />
      <div className={styles.heroStampOrbit}>
        {ORBIT_DOTS.map((index) => (
          <span key={index} style={{ '--orbit-index': index } as CSSProperties} />
        ))}
      </div>
      <div className={styles.heroStampOrbitSecondary}>
        {ORBIT_DOTS.map((index) => (
          <span key={index} style={{ '--orbit-index': index } as CSSProperties} />
        ))}
      </div>
      <div
        className={styles.heroStampInner}
        style={innerTransform ? { transform: innerTransform } : undefined}
      >
        <div className={styles.heroStampIconWrap}>
          <LogoIcon
            fluid
            variant="stamp"
            className={styles.heroStampIcon}
            chimneySmokeColor={smoke.chimney}
            animateChimneySmoke={animateStamp}
          />
          <div className={styles.heroStampShine} />
        </div>
      </div>
    </div>
  );
});

export {
  HeroStamp,
};
