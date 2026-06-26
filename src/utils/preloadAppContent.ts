import { isNativeApp } from '@/utils/nativeApp';

async function preloadHomeSections(): Promise<void> {
  await Promise.all([
    import('@/pages/HomePage/components/BoardPortalSection'),
    import('@/pages/HomePage/components/PopularServicesSection'),
    import('@/pages/HomePage/components/MapSection'),
    import('@/pages/HomePage/components/CategoriesSection'),
    import('@/pages/HomePage/components/ForumSection'),
    import('@/pages/HomePage/components/ReviewsSection'),
    import('@/pages/HomePage/components/StepsSection'),
    import('@/pages/HomePage/components/FeaturesSection'),
    import('@/pages/HomePage/components/CtaSection'),
  ]);
}

async function preloadNativeRoutes(): Promise<void> {
  await Promise.all([
    preloadHomeSections(),
    import('@/pages/BoardHubPage/BoardHubPage'),
    import('@/pages/BoardKindPage/BoardKindPage'),
    import('@/pages/ServicesPage/ServicesPage'),
    import('@/pages/ForumPage/ForumPage'),
  ]);
}

async function preloadAppContent(): Promise<void> {
  if (!isNativeApp()) {
    return;
  }
  await preloadNativeRoutes();
}

function waitForWindowLoad(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (document.readyState === 'complete') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true });
  });
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

export {
  preloadAppContent,
  preloadHomeSections,
  waitForNextPaint,
  waitForWindowLoad,
};
