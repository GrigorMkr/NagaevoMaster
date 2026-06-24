import { memo, useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { RichIcon } from '@/components/ui/RichIcon';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import { isNativeApp } from '@/utils/nativeApp';
import { PORTAL_CAPABILITIES, PORTAL_TICKER } from '@/data/portalCapabilities';
import { HeroStamp } from './HeroStamp';
import styles from './HeroCapabilityShowcase.module.css';

const CARD_INTERVAL_MS = 5000;
const CARD_INTERVAL_LOW_POWER_MS = 7000;
const TICKER_ITEMS = [...PORTAL_TICKER, ...PORTAL_TICKER];
const SPARKLE_INDICES = [0, 1, 2, 3] as const;

const HeroCapabilityShowcase = memo(function HeroCapabilityShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { lowPower } = usePerformanceProfile();
  const nativeApp = isNativeApp();
  const heavyEffects = !lowPower && !nativeApp;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    const interval = lowPower ? CARD_INTERVAL_LOW_POWER_MS : CARD_INTERVAL_MS;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % PORTAL_CAPABILITIES.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [lowPower, reducedMotion]);

  const item = PORTAL_CAPABILITIES[activeIndex];
  const fromLeft = activeIndex % 2 === 0;

  if (!item) {
    return null;
  }

  const card = (
    <Link
      key={activeIndex}
      to={item.to}
      className={`${styles.flyCard} ${fromLeft ? styles.flyFromLeft : styles.flyFromRight}`}
      style={{
        '--cap-accent': item.accent,
        '--cap-accent2': item.accent2,
        '--cap-glow': item.glow,
      } as CSSProperties}
    >
      <span className={styles.flyNeon} aria-hidden />
      <span className={styles.flyBeam} aria-hidden />
      {!heavyEffects && <span className={styles.flySheen} aria-hidden />}
      {!heavyEffects && <span className={styles.flyRipple} aria-hidden />}

      {!heavyEffects && (
        <div className={styles.flySparkles} aria-hidden>
          {SPARKLE_INDICES.map((i) => (
            <span key={i} className={styles.flySparkle} style={{ '--sparkle-i': i } as CSSProperties} />
          ))}
        </div>
      )}

      <div className={styles.flyInner}>
        <RichIcon
          name={item.icon}
          variant="gem"
          size="lg"
          accent={item.accent}
          accent2={item.accent2}
          motion={lowPower ? 'none' : 'float'}
          className={styles.flyIcon}
        />

        <h3 className={styles.flyTitle}>{item.title}</h3>
        <p className={styles.flyText}>{item.text}</p>

        <span className={styles.flyCta}>
          Открыть
          <ToolbarIcon name="chevronRight" accent={item.accent} motion={heavyEffects ? 'pulse' : undefined} />
        </span>
      </div>
    </Link>
  );

  return (
    <div className={styles.showcase} aria-live="polite">
      {!heavyEffects && <div className={styles.stageGlow} aria-hidden />}

      <div className={styles.stage}>
        <div className={styles.sideLeft}>
          {fromLeft ? card : null}
        </div>

        <div className={styles.stampCol}>
          <HeroStamp />
        </div>

        <div className={styles.sideRight}>
          {!fromLeft ? card : null}
        </div>
      </div>

      <div className={styles.tickerWrap} aria-hidden>
        <div className={styles.tickerTrack}>
          {TICKER_ITEMS.map((word, i) => (
            <span key={`${word}-${i}`} className={styles.tickerItem}>
              <span className={styles.tickerDot} />
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export {
  HeroCapabilityShowcase,
};
