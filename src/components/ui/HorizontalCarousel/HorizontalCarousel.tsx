import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import classNames from 'classnames';
import styles from './HorizontalCarousel.module.css';

/** Единая скорость автопрокрутки для всех каруселей (px/с). */
const CAROUSEL_AUTO_SCROLL_SPEED = 22;

const MANUAL_PAUSE_MS = 6000;

interface HorizontalCarouselProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
  slideClassName?: string;
  autoScroll?: boolean;
  /** @deprecated используйте единую скорость CAROUSEL_AUTO_SCROLL_SPEED */
  autoScrollDurationSec?: number;
  autoScrollSpeedPxPerSec?: number;
  showArrows?: boolean;
  showDots?: boolean;
  enterFromLeft?: boolean;
  minLoopItems?: number;
}

function buildLoopItems<T>(items: T[], minCount: number): T[] {
  if (items.length === 0) return [];
  let loop = [...items];
  while (loop.length < minCount) {
    loop = [...loop, ...items];
  }
  return [...loop, ...loop];
}

function HorizontalCarousel({
  children,
  ariaLabel = 'Карусель',
  className,
  slideClassName,
  autoScroll = true,
  autoScrollSpeedPxPerSec = CAROUSEL_AUTO_SCROLL_SPEED,
  showArrows,
  showDots = false,
  enterFromLeft = true,
  minLoopItems = 6,
}: HorizontalCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const pauseTimerRef = useRef<number | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  const items = Children.toArray(children);
  const loopItems = useMemo(
    () => (autoScroll ? buildLoopItems(items, minLoopItems) : items),
    [autoScroll, items, minLoopItems],
  );
  const displayItems = autoScroll ? loopItems : items;
  const arrowsVisible = showArrows ?? autoScroll;

  const pauseAuto = useCallback((ms = MANUAL_PAUSE_MS) => {
    pausedRef.current = true;
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
    }
    pauseTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false;
      pauseTimerRef.current = null;
    }, ms);
  }, []);

  const normalizeLoopScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || !autoScroll) return;

    const loopWidth = track.scrollWidth / 2;
    if (loopWidth <= 0) return;

    if (track.scrollLeft >= loopWidth) {
      track.scrollLeft -= loopWidth;
    }
  }, [autoScroll]);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);

    if (autoScroll) {
      setCanPrev(true);
      setCanNext(true);
      return;
    }

    setCanPrev(scrollLeft > 8);
    setCanNext(scrollLeft < maxScroll - 8);

    const pages = maxScroll <= 0 ? 1 : Math.ceil(maxScroll / clientWidth) + 1;
    setPageCount(pages);
    setActivePage(
      maxScroll <= 0 ? 0 : Math.min(pages - 1, Math.round((scrollLeft / maxScroll) * (pages - 1))),
    );
  }, [autoScroll]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    updateScrollState();

    const onScroll = () => {
      if (autoScroll) {
        normalizeLoopScroll();
      }
      updateScrollState();
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);

    return () => {
      track.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [autoScroll, children, normalizeLoopScroll, updateScrollState]);

  useEffect(() => {
    if (!autoScroll || reduceMotion) return undefined;

    const track = trackRef.current;
    if (!track) return undefined;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      if (!pausedRef.current && !document.hidden) {
        const dt = Math.min((now - last) / 1000, 0.05);
        track.scrollLeft += autoScrollSpeedPxPerSec * dt;
        normalizeLoopScroll();
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll, autoScrollSpeedPxPerSec, displayItems.length, normalizeLoopScroll, reduceMotion]);

  useEffect(() => () => {
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
    }
  }, []);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    if (autoScroll) {
      const loopWidth = track.scrollWidth / 2;
      if (direction < 0 && track.scrollLeft < track.clientWidth * 0.2 && loopWidth > 0) {
        track.scrollLeft += loopWidth;
      }
      pauseAuto();
    }

    track.scrollBy({ left: direction * track.clientWidth * 0.88, behavior: 'smooth' });
  };

  const goToPage = (index: number) => {
    const track = trackRef.current;
    if (!track || autoScroll) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;
    const pages = pageCount;
    const target = pages <= 1 ? 0 : (index / (pages - 1)) * maxScroll;
    track.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handlePointerDown = () => {
    if (autoScroll) {
      pauseAuto();
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={classNames(styles.shell, autoScroll && styles.shellAuto, className)}
      onMouseEnter={autoScroll ? () => { pausedRef.current = true; } : undefined}
      onMouseLeave={autoScroll ? () => { pausedRef.current = false; } : undefined}
    >
      {arrowsVisible && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Прокрутить назад"
            disabled={!canPrev}
            onClick={() => scrollByPage(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Прокрутить вперёд"
            disabled={!canNext}
            onClick={() => scrollByPage(1)}
          >
            ›
          </button>
        </div>
      )}

      <div className={autoScroll ? styles.viewportAuto : undefined}>
        <div
          ref={trackRef}
          className={classNames(
            styles.track,
            autoScroll && styles.trackLoop,
            reduceMotion && autoScroll && styles.trackLoopStatic,
          )}
          role="region"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onWheel={autoScroll ? () => pauseAuto() : undefined}
        >
          {displayItems.map((child, index) => (
            <div
              key={index}
              className={classNames(
                styles.slide,
                !autoScroll && enterFromLeft && styles.slideEnter,
                slideClassName,
              )}
              style={!autoScroll && enterFromLeft ? { animationDelay: `${Math.min(index, 8) * 0.05}s` } : undefined}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showDots && !autoScroll && pageCount > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Страницы карусели">
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activePage}
              aria-label={`Страница ${index + 1}`}
              className={classNames(styles.dot, index === activePage && styles.dotActive)}
              onClick={() => goToPage(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export {
  HorizontalCarousel,
  CAROUSEL_AUTO_SCROLL_SPEED,
};

export type {
  HorizontalCarouselProps,
};
