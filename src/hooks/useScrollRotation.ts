import { useEffect, useRef, useState, type RefObject } from 'react';
import { SCROLL_ROTATION_FACTOR } from '@/constants';

const ROTATION_SMOOTHING = 0.14;
const PARALLAX_SMOOTHING = 0.12;
const PARALLAX_FACTOR = 0.05;

interface ScrollTilt {
  rotate: number;
  scale: number;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

function useScrollRotation(
  innerRef: RefObject<HTMLDivElement | null>,
  tilt: ScrollTilt,
) {
  const reducedMotion = usePrefersReducedMotion();
  const targetRotation = useRef(0);
  const smoothRotation = useRef(0);
  const smoothParallax = useRef(0);
  const lastScrollY = useRef(0);
  const tiltRef = useRef(tilt);

  useEffect(() => {
    tiltRef.current = tilt;
  }, [tilt]);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    lastScrollY.current = window.scrollY;

    let frameId = 0;

    const tick = () => {
      const element = innerRef.current;

      if (element) {
        smoothRotation.current += (targetRotation.current - smoothRotation.current) * ROTATION_SMOOTHING;

        const targetParallax = window.scrollY * PARALLAX_FACTOR;
        smoothParallax.current += (targetParallax - smoothParallax.current) * PARALLAX_SMOOTHING;

        const { rotate, scale } = tiltRef.current;
        element.style.transform = `translate3d(0, ${smoothParallax.current}px, 0) rotate(${smoothRotation.current + rotate}deg) scale(${scale})`;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;
      targetRotation.current += delta * SCROLL_ROTATION_FACTOR;
    };

    frameId = window.requestAnimationFrame(tick);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [innerRef, reducedMotion]);

  return { reducedMotion };
}

export {
  useScrollRotation,
}
