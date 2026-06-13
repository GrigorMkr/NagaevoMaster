import { memo, useCallback, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { LogoIcon } from '@/components/ui/Logo/LogoIcon';
import { useScrollRotation } from '@/hooks/useScrollRotation';
import styles from '../HomePage.module.css';

const ORBIT_DOTS = [0, 1, 2] as const;

const HeroStamp = memo(function HeroStamp() {
  const innerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotate: 0, rotateX: 0, rotateY: 0, scale: 1 });
  const { reducedMotion } = useScrollRotation(innerRef, tilt);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) {
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
  }, [reducedMotion]);

  const handlePointerLeave = useCallback(() => {
    setTilt({ rotate: 0, rotateX: 0, rotateY: 0, scale: 1 });
  }, []);

  return (
    <div
      className={styles.heroStampWrap}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-hidden="true"
    >
      <div className={styles.heroStampAura} />
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
          <LogoIcon fluid className={styles.heroStampIcon} />
          <div className={styles.heroStampShine} />
        </div>
      </div>
    </div>
  );
});

export {
  HeroStamp,
}
