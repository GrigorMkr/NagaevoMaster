import { memo, useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  DESKTOP_BACKGROUNDS,
  DESKTOP_BACKGROUND_INTERVAL_MS,
} from '@/data/desktopBackgrounds';
import { shouldUseMobileLayout } from '@/hooks/useMobileLayout';
import { publicUrl } from '@/utils/publicUrl';

const DESKTOP_MEDIA = '(min-width: 769px)';

const SiteBackground = memo(function SiteBackground() {
  const [isDesktop, setIsDesktop] = useState(() => (
    !shouldUseMobileLayout() && window.matchMedia(DESKTOP_MEDIA).matches
  ));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA);
    const sync = () => {
      setIsDesktop(!shouldUseMobileLayout() && media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    window.addEventListener('resize', sync, { passive: true });
    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % DESKTOP_BACKGROUNDS.length);
    }, DESKTOP_BACKGROUND_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;

    const nextIndex = (activeIndex + 1) % DESKTOP_BACKGROUNDS.length;
    const nextPhoto = DESKTOP_BACKGROUNDS[nextIndex];
    if (!nextPhoto) return;

    const preload = new Image();
    preload.decoding = 'async';
    preload.src = nextPhoto.src;
  }, [activeIndex, isDesktop]);

  return (
    <div className="siteSurface" aria-hidden="true">
      <img
        className="siteSurface__img siteSurface__imgMobile"
        src={publicUrl('/backgrounds/desktop-red-lake.jpg')}
        alt=""
        decoding="async"
        fetchPriority="high"
        style={{ objectPosition: 'center 42%' }}
      />

      {isDesktop && DESKTOP_BACKGROUNDS.map((photo, index) => (
        <img
          key={photo.src}
          className={classNames(
            'siteSurface__img',
            'siteSurface__imgDesktop',
            index === activeIndex && 'siteSurface__imgDesktopActive',
          )}
          src={photo.src}
          alt=""
          decoding="async"
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchPriority={index === 0 ? 'high' : 'low'}
          style={{ objectPosition: photo.position }}
        />
      ))}

      <div className="siteSurface__veil" />
      <div className="siteSurface__wash" />
      <div className="siteSurface__blob siteSurface__blobGreen" />
      <div className="siteSurface__blob siteSurface__blobGold" />
      <div className="siteSurface__blob siteSurface__blobCoral" />
      <div className="siteSurface__blob siteSurface__blobMint" />
      <div className="siteSurface__ring siteSurface__ring1" />
      <div className="siteSurface__ring siteSurface__ring2" />
      <div className="siteSurface__sparkles" />
      <div className="siteSurface__grid" />
      <div className="siteSurface__hills" />
      <div className="siteSurface__shine" />
    </div>
  );
});

export {
  SiteBackground,
};
