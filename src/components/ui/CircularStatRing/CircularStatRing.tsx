import styles from './CircularStatRing.module.css';

type Accent = 'mint' | 'gold' | 'coral' | 'blue' | 'muted';

interface CircularStatRingProps {
  label: string;
  value: number;
  max?: number;
  hint?: string;
  accent?: Accent;
  compact?: boolean;
  showPercent?: boolean;
}

const RING_SIZE = 88;
const STROKE = 7;

function formatStatValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 10_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return value.toLocaleString('ru-RU');
}

function resolvePercent(value: number, max?: number): number {
  if (max === undefined || max <= 0) {
    return value > 0 ? 100 : 0;
  }
  return Math.min(100, Math.round((value / max) * 100));
}

function CircularStatRing({
  label,
  value,
  max,
  hint,
  accent = 'mint',
  compact = false,
  showPercent = true,
}: CircularStatRingProps) {
  const percent = resolvePercent(value, max);
  const radius = (RING_SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;
  const compactSize = 62;
  const size = compact ? compactSize : RING_SIZE;
  const stroke = compact ? 5.5 : STROKE;
  const compactRadius = (size - stroke) / 2;
  const compactCircumference = 2 * Math.PI * compactRadius;
  const compactDashOffset = compactCircumference - (percent / 100) * compactCircumference;
  const activeRadius = compact ? compactRadius : radius;
  const activeCircumference = compact ? compactCircumference : circumference;
  const activeDashOffset = compact ? compactDashOffset : dashOffset;

  return (
    <article
      className={`${styles.root} ${styles[`accent_${accent}`]} ${compact ? styles.compact : ''}`}
      aria-label={`${label}: ${value}${max !== undefined && showPercent ? `, ${percent}%` : ''}`}
    >
      <div className={styles.ringWrap} style={{ width: size, height: size }}>
        <svg
          className={styles.ring}
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          aria-hidden
        >
          <circle
            className={styles.track}
            cx={size / 2}
            cy={size / 2}
            r={activeRadius}
            fill="none"
            strokeWidth={stroke}
          />
          <circle
            className={styles.fill}
            cx={size / 2}
            cy={size / 2}
            r={activeRadius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={activeCircumference}
            strokeDashoffset={activeDashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className={styles.center}>
          <p className={styles.value}>{formatStatValue(value)}</p>
          {showPercent && max !== undefined && max > 0 && (
            <p className={styles.percent}>{percent}%</p>
          )}
        </div>
      </div>
      <p className={styles.label}>{label}</p>
      {hint && !compact && <p className={styles.hint}>{hint}</p>}
    </article>
  );
}

export { CircularStatRing };

export type { CircularStatRingProps };
