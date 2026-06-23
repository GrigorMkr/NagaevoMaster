import type { CSSProperties } from 'react';
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { BOARD_KINDS } from '@/data/boardKinds';
import { boardKindPath } from '@/constants';
import { RichIcon } from '@/components/ui/RichIcon';
import styles from './BoardPortalGrid.module.css';

interface BoardPortalGridProps {
  compact?: boolean;
}

const BoardPortalGrid = memo(function BoardPortalGrid({ compact = false }: BoardPortalGridProps) {
  return (
    <div className={compact ? styles.gridCompact : styles.grid}>
      {BOARD_KINDS.map((item, index) => (
        <Link
          key={item.kind}
          to={boardKindPath(item.kind)}
          className={styles.card}
          style={{
            '--board-accent': item.accent,
            '--board-glow': item.glow,
            '--board-cover': `url(${item.coverImage})`,
            '--board-cover-pos': item.coverPosition,
            animationDelay: `${index * 0.06}s`,
          } as CSSProperties}
        >
          <div className={styles.cardCover} aria-hidden />
          <div className={styles.cardScrim} aria-hidden />
          <div className={styles.cardGlow} aria-hidden />
          <div className={styles.cardInner}>
            <RichIcon
              name={item.icon}
              variant="gem"
              size="md"
              accent={item.accent}
              className={styles.icon}
            />
            <div className={styles.text}>
              <span className={styles.subtitle}>{item.subtitle}</span>
              <h3 className={styles.title}>{item.title}</h3>
              {!compact && <p className={styles.desc}>{item.description}</p>}
              <p className={styles.examples}>{item.examples}</p>
            </div>
            <span className={styles.arrow} aria-hidden>→</span>
          </div>
        </Link>
      ))}
    </div>
  );
});

export {
  BoardPortalGrid,
};
