import { memo, useCallback, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import classNames from 'classnames';
import { LogoIcon } from '@/components/ui/Logo/LogoIcon';
import { STAMP_SMOKE_PALETTE } from '@/data/stampSmokePalette';
import { useScrollRotation } from '@/hooks/useScrollRotation';
import styles from '../HomePage.module.css';

const ORBIT_DOTS = [0, 1, 2] as const;

const HeroStamp = memo(function HeroStamp() {
  const innerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotate: 0, rotateX: 0, rotateY: 0, scale: 1 });
  const [smokeIndex, setSmokeIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const { reducedMotion, lowPower } = useScrollRotation(innerRef, tilt);
  const smoke = STAMP_SMOKE_PALETTE[smokeIndex] ?? STAMP_SMOKE_PALETTE[0]!;

  const smokeStyle = {
    '--stamp-smoke-core': smoke.core,
    '--stamp-smoke-mid': smoke.mid,
    '--stamp-smoke-glow': smoke.glow,
  } as CSSProperties;

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || lowPower) {
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
  }, [reducedMotion, lowPower]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    setTilt({ rotate: 0, rotateX: 0, rotateY: 0, scale: 1 });
  }, []);

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const handleStampClick = useCallback(() => {
    setSmokeIndex((current) => (current + 1) % STAMP_SMOKE_PALETTE.length);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStampClick();
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
      <div ref={innerRef} className={styles.heroStampInner}>
        <div className={styles.heroStampIconWrap}>
          <LogoIcon
            fluid
            variant="stamp"
            className={styles.heroStampIcon}
            chimneySmokeColor={smoke.chimney}
            animateChimneySmoke={!reducedMotion && !lowPower}
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
