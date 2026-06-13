import { memo, useCallback, useRef, useState, type PointerEvent } from 'react';
import { LogoIcon } from '@/components/ui/Logo/LogoIcon';
import { useScrollRotation } from '@/hooks/useScrollRotation';
import styles from '../HomePage.module.css';

const HeroStamp = memo(function HeroStamp() {
  const innerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotate: 0, scale: 1 });
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
      scale: 1.03,
    });
  }, [reducedMotion]);

  const handlePointerLeave = useCallback(() => {
    setTilt({ rotate: 0, scale: 1 });
  }, []);

  return (
    <div
      className={styles.heroStampWrap}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-hidden="true"
    >
      <div className={styles.heroStampRing} />
      <div className={styles.heroStampRingSecondary} />
      <div ref={innerRef} className={styles.heroStampInner}>
        <LogoIcon fluid className={styles.heroStampIcon} />
      </div>
    </div>
  );
});

export {
  HeroStamp,
}
