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
import { isLowPowerDevice } from '@/utils/performanceProfile';

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
  /** Дублировать слайды для бесшовной прокрутки. По умолчанию true. */
  loop?: boolean;
  /** Растягивать карусель на всю ширину с отрицательными отступами. */
  bleed?: boolean;
  /** Градиентное затухание по краям. */
  fadeEdges?: boolean;
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
  loop = true,
  bleed,
  fadeEdges,
}: HorizontalCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const offscreenRef = useRef(false);
  const pauseTimerRef = useRef<number | null>(null);
  const scrollDirectionRef = useRef(1);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const lowPower = isLowPowerDevice();
  const effectiveAutoScroll = autoScroll && !reduceMotion;
  const scrollSpeed = lowPower ? autoScrollSpeedPxPerSec * 0.55 : autoScrollSpeedPxPerSec;
  const useBleed = bleed ?? effectiveAutoScroll;
  const useFadeEdges = fadeEdges ?? effectiveAutoScroll;

  const items = Children.toArray(children);
  const loopEnabled = loop && effectiveAutoScroll && !lowPower;
  const loopItems = useMemo(
    () => (loopEnabled ? buildLoopItems(items, minLoopItems) : items),
    [loopEnabled, items, minLoopItems],
  );
  const displayItems = loopEnabled ? loopItems : items;
  const arrowsVisible = showArrows ?? effectiveAutoScroll;

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
    if (!track || !effectiveAutoScroll || !loopEnabled) return;

    const loopWidth = track.scrollWidth / 2;
    if (loopWidth <= 0) return;

    if (track.scrollLeft >= loopWidth) {
      track.scrollLeft -= loopWidth;
    }
  }, [effectiveAutoScroll, loopEnabled]);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);

    if (effectiveAutoScroll) {
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
  }, [effectiveAutoScroll]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !effectiveAutoScroll) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        offscreenRef.current = !entry?.isIntersecting;
      },
      { root: null, threshold: 0.08, rootMargin: '48px' },
    );

    observer.observe(track);
    return () => observer.disconnect();
  }, [effectiveAutoScroll, displayItems.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    updateScrollState();

    const onScroll = () => {
      if (effectiveAutoScroll && loopEnabled) {
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
  }, [children, effectiveAutoScroll, loopEnabled, normalizeLoopScroll, updateScrollState]);

  useEffect(() => {
    if (!effectiveAutoScroll || reduceMotion) return undefined;

    const track = trackRef.current;
    if (!track) return undefined;

    let raf = 0;
    let last = performance.now();
    scrollDirectionRef.current = 1;

    const tick = (now: number) => {
      if (!pausedRef.current && !offscreenRef.current && !document.hidden) {
        const dt = Math.min((now - last) / 1000, 0.05);
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

        if (maxScroll > 0) {
          track.scrollLeft += scrollDirectionRef.current * scrollSpeed * dt;

          if (loopEnabled) {
            normalizeLoopScroll();
          } else if (track.scrollLeft >= maxScroll) {
            track.scrollLeft = maxScroll;
            scrollDirectionRef.current = -1;
          } else if (track.scrollLeft <= 0) {
            track.scrollLeft = 0;
            scrollDirectionRef.current = 1;
          }
        }
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    effectiveAutoScroll,
    scrollSpeed,
    displayItems.length,
    loopEnabled,
    normalizeLoopScroll,
    reduceMotion,
  ]);

  useEffect(() => () => {
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
    }
  }, []);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    if (effectiveAutoScroll && loopEnabled) {
      const loopWidth = track.scrollWidth / 2;
      if (direction < 0 && track.scrollLeft < track.clientWidth * 0.2 && loopWidth > 0) {
        track.scrollLeft += loopWidth;
      }
      pauseAuto();
    } else if (effectiveAutoScroll) {
      pauseAuto();
    }

    track.scrollBy({ left: direction * track.clientWidth * 0.88, behavior: 'smooth' });
  };

  const goToPage = (index: number) => {
    const track = trackRef.current;
    if (!track || effectiveAutoScroll) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;
    const pages = pageCount;
    const target = pages <= 1 ? 0 : (index / (pages - 1)) * maxScroll;
    track.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handlePointerDown = () => {
    if (effectiveAutoScroll) {
      pauseAuto();
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={classNames(styles.shell, useBleed && styles.shellAuto, className)}
      onMouseEnter={effectiveAutoScroll ? () => { pausedRef.current = true; } : undefined}
      onMouseLeave={effectiveAutoScroll ? () => { pausedRef.current = false; } : undefined}
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

      <div className={classNames(useFadeEdges && styles.viewportAuto, !loopEnabled && styles.viewportPadded)}>
        <div
          ref={trackRef}
          className={classNames(
            styles.track,
            loopEnabled && styles.trackLoop,
            !loopEnabled && effectiveAutoScroll && styles.trackScroll,
            reduceMotion && loopEnabled && styles.trackLoopStatic,
          )}
          role="region"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onWheel={effectiveAutoScroll ? () => pauseAuto() : undefined}
        >
          {displayItems.map((child, index) => (
            <div
              key={index}
              className={classNames(
                styles.slide,
                !effectiveAutoScroll && enterFromLeft && styles.slideEnter,
                slideClassName,
              )}
              style={!effectiveAutoScroll && enterFromLeft ? { animationDelay: `${Math.min(index, 8) * 0.05}s` } : undefined}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showDots && !effectiveAutoScroll && pageCount > 1 && (
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
