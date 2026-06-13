const LISTING_IMAGE_BASE = `${import.meta.env.BASE_URL || '/'}`.replace(/\/$/, '') + '/listings';

function localImage(name: string): string {
  return `${LISTING_IMAGE_BASE}/${name}`.replace(/\/{2,}/g, '/');
}

const SUBCATEGORY_IMAGES: Record<string, string[]> = {
  electricians: [
    localImage('electricians-1.jpg'),
    localImage('electricians-2.jpg'),
  ],
  'agri-machinery': [
    localImage('agri-machinery-1.png'),
    localImage('agri-machinery-2.jpg'),
  ],
  earthmoving: [
    localImage('earthmoving-1.jpg'),
    localImage('earthmoving-2.jpg'),
  ],
  hairdresser: [
    localImage('hairdresser-1.jpg'),
    localImage('hairdresser-2.jpg'),
  ],
  barber: [
    localImage('barber-1.jpg'),
    localImage('barber-2.jpg'),
  ],
  nails: [
    localImage('nails-1.jpg'),
    localImage('nails-2.jpg'),
  ],
  roofers: [
    localImage('roofers-1.jpg'),
    localImage('roofers-2.jpg'),
  ],
  plumbers: [
    localImage('plumbers-1.jpg'),
    localImage('plumbers-2.jpg'),
  ],
  'septic-service': [
    localImage('septic-service-1.jpg'),
  ],
  mowing: [
    localImage('mowing-1.jpg'),
    localImage('mowing-2.jpg'),
  ],
  cleaners: [
    localImage('cleaners-1.jpg'),
  ],
  'country-move': [
    localImage('country-move-1.jpg'),
  ],
  plowing: [
    localImage('plowing-1.jpg'),
  ],
  lawyers: [
    localImage('lawyers-1.jpg'),
  ],
  'firewood-sales': [
    localImage('firewood-sales-1.jpg'),
  ],
  water: [
    localImage('water-1.png'),
  ],
  waste: [
    localImage('waste-1.jpg'),
  ],
  gardeners: [
    localImage('gardeners-1.jpg'),
  ],
  glazing: [
    localImage('glazing-1.jpg'),
  ],
  evacuator: [
    localImage('evacuator-1.jpg'),
  ],
  'septic-install': [
    localImage('septic-install-1.jpg'),
  ],
  tutors: [
    localImage('tutors-1.jpg'),
  ],
  'bulk-materials': [
    localImage('bulk-materials-1.webp'),
  ],
  builders: [
    localImage('builders-1.jpg'),
    localImage('builders-2.jpg'),
  ],
  photographers: [
    localImage('photographers-1.jpg'),
  ],
};

const CATEGORY_IMAGES: Record<string, string[]> = {
  construction: [
    localImage('construction-1.jpg'),
    localImage('construction-2.jpg'),
  ],
  machinery: [
    localImage('machinery-1.png'),
    localImage('agri-machinery-1.png'),
  ],
  utility: [
    localImage('utility-1.png'),
    localImage('septic-service-1.jpg'),
  ],
  beauty: [
    localImage('beauty-1.jpg'),
    localImage('beauty-2.jpg'),
  ],
  farming: [
    localImage('farming-1.png'),
    localImage('farming-2.jpg'),
  ],
  staff: [
    localImage('cleaners-1.jpg'),
    localImage('gardeners-1.jpg'),
  ],
  logistics: [
    localImage('country-move-1.jpg'),
    localImage('evacuator-1.jpg'),
  ],
  pro: [
    localImage('lawyers-1.jpg'),
    localImage('photographers-1.jpg'),
  ],
  sales: [
    localImage('bulk-materials-1.webp'),
    localImage('firewood-sales-1.jpg'),
  ],
};

const DEFAULT_IMAGES = [
  localImage('default-1.jpg'),
  localImage('default-2.png'),
];

function getListingImages(category: string, subcategory: string, listingId: string): string[] {
  const specific = SUBCATEGORY_IMAGES[subcategory];
  const pool: string[] = specific?.length
    ? specific
    : CATEGORY_IMAGES[category]?.length
      ? (CATEGORY_IMAGES[category] ?? DEFAULT_IMAGES)
      : DEFAULT_IMAGES;

  const seed = Number.parseInt(listingId, 10) || listingId.charCodeAt(0);
  const offset = seed % pool.length;
  const fallback = DEFAULT_IMAGES[0]!;
  const primary = pool[offset] ?? pool[0] ?? fallback;
  const secondary = pool[(offset + 1) % pool.length] ?? pool[0] ?? fallback;

  return primary === secondary ? [primary] : [primary, secondary];
}

const CATEGORY_COVER_KEYS: Record<string, [string, string]> = {
  construction: ['construction', 'builders'],
  machinery: ['machinery', 'agri-machinery'],
  utility: ['utility', 'septic-service'],
  staff: ['staff', 'cleaners'],
  farming: ['farming', 'mowing'],
  sales: ['sales', 'firewood-sales'],
  beauty: ['beauty', 'hairdresser'],
};

const CATEGORY_COVER_DIRECT: Record<string, string> = {
  logistics: localImage('evacuator-1.jpg'),
  pro: localImage('tutors-1.jpg'),
};

const FORUM_COVER_FILES: Record<string, string> = {
  construction: 'construction-1.jpg',
  plumbing: 'plumbers-1.jpg',
  electric: 'electricians-1.jpg',
  machinery: 'earthmoving-1.jpg',
  septic: 'septic-service-1.jpg',
  cleaning: 'waste-1.jpg',
  beauty: 'beauty-1.jpg',
  general: 'default-1.jpg',
};

function getCategoryCover(slug: string): string {
  const direct = CATEGORY_COVER_DIRECT[slug];
  if (direct) {
    return direct;
  }

  const keys = CATEGORY_COVER_KEYS[slug];
  if (!keys) {
    return DEFAULT_IMAGES[0]!;
  }

  return getListingImages(keys[0], keys[1], slug)[0] ?? DEFAULT_IMAGES[0]!;
}

function getForumCategoryCover(slug: string): string {
  const file = FORUM_COVER_FILES[slug];
  return file ? localImage(file) : DEFAULT_IMAGES[0]!;
}

export {
  getListingImages,
  getCategoryCover,
  getForumCategoryCover,
}
