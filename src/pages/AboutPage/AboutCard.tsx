import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import classNames from 'classnames';
import styles from './AboutPage.module.css';

interface AboutCardProps {
  title: string;
  image: string;
  alt: string;
  children: ReactNode;
}

function AboutCard({ title, image, alt, children }: AboutCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [expanded, setExpandedState] = useState(false);

  const setExpanded = useCallback((next: boolean) => {
    setExpandedState(next);
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpandedState((prev) => !prev);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const onCardPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      event.stopPropagation();
      toggleExpanded();
    };

    const onPointerDownOutside = (event: PointerEvent) => {
      if (!expanded) return;
      if (card.contains(event.target as Node)) return;
      setExpanded(false);
    };

    card.addEventListener('pointerdown', onCardPointerDown);
    document.addEventListener('pointerdown', onPointerDownOutside);

    return () => {
      card.removeEventListener('pointerdown', onCardPointerDown);
      document.removeEventListener('pointerdown', onPointerDownOutside);
    };
  }, [expanded, setExpanded, toggleExpanded]);

  return (
    <article
      ref={cardRef}
      className={classNames(styles.card, expanded && styles.cardExpanded)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleExpanded();
        }

        if (event.key === 'Escape') {
          setExpanded(false);
        }
      }}
    >
      <div className={styles.cardMedia}>
        <img className={styles.cardImage} src={image} alt={alt} loading="lazy" />
        <div className={styles.cardPanel}>
          <h2>{title}</h2>
          <div className={styles.cardContent}>{children}</div>
        </div>
      </div>
    </article>
  );
}

export {
  AboutCard,
};
