import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import styles from './AboutPage.module.css';

interface AboutCardProps {
  title: string;
  image: string;
  alt: string;
  children: ReactNode;
}

function AboutCard({ title, image, alt, children }: AboutCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const expandedRef = useRef(false);
  const expandedClassRef = useRef<string | null>(null);

  const setExpanded = useCallback((next: boolean) => {
    const card = cardRef.current;
    if (!card) return;

    expandedRef.current = next;
    if (expandedClassRef.current) {
      card.classList.remove(expandedClassRef.current);
      expandedClassRef.current = null;
    }

    if (next) {
      expandedClassRef.current = styles.cardExpanded;
      card.classList.add(styles.cardExpanded);
    }
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded(!expandedRef.current);
  }, [setExpanded]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const onCardPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      event.stopPropagation();
      toggleExpanded();
    };

    const onPointerDownOutside = (event: PointerEvent) => {
      if (!expandedRef.current) return;
      if (card.contains(event.target as Node)) return;
      setExpanded(false);
    };

    card.addEventListener('pointerdown', onCardPointerDown);
    document.addEventListener('pointerdown', onPointerDownOutside);

    return () => {
      card.removeEventListener('pointerdown', onCardPointerDown);
      document.removeEventListener('pointerdown', onPointerDownOutside);
    };
  }, [setExpanded, toggleExpanded]);

  return (
    <article
      ref={cardRef}
      className={styles.card}
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
