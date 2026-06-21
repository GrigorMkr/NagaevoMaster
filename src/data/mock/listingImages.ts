import { listingStemFile, listingSvgThumb } from '@/utils/listingImageUrl';

function img(stem: string): string {
  return listingStemFile(stem);
}

const SUBCATEGORY_IMAGES: Record<string, string[]> = {
  electricians: [img('electricians-1'), img('electricians-2')],
  'agri-machinery': [img('agri-machinery-1'), img('agri-machinery-2')],
  earthmoving: [img('earthmoving-1'), img('earthmoving-2')],
  hairdresser: [img('hairdresser-1'), img('hairdresser-2')],
  barber: [img('barber-1'), img('barber-2')],
  nails: [img('nails-1'), img('nails-2')],
  roofers: [img('roofers-1'), img('roofers-2')],
  plumbers: [img('plumbers-1'), img('plumbers-2')],
  'septic-service': [img('septic-service-1')],
  mowing: [img('mowing-1'), img('mowing-2')],
  cleaners: [img('cleaners-1')],
  'country-move': [img('country-move-1')],
  plowing: [img('plowing-1')],
  lawyers: [img('lawyers-1')],
  'firewood-sales': [img('firewood-sales-1')],
  water: [img('water-1')],
  waste: [img('waste-1')],
  gardeners: [img('gardeners-1')],
  glazing: [img('glazing-1')],
  evacuator: [img('evacuator-1')],
  'septic-install': [img('septic-install-1')],
  tutors: [img('tutors-1')],
  'bulk-materials': [img('bulk-materials-1')],
  builders: [img('builders-1'), img('builders-2')],
  photographers: [img('photographers-1')],
};

const CATEGORY_IMAGES: Record<string, string[]> = {
  construction: [img('construction-1'), img('construction-2')],
  machinery: [img('machinery-1'), img('agri-machinery-1')],
  utility: [img('utility-1'), img('septic-service-1')],
  beauty: [img('beauty-1'), img('beauty-2')],
  farming: [img('farming-1'), img('farming-2')],
  staff: [img('cleaners-1'), img('gardeners-1')],
  logistics: [img('country-move-1'), img('evacuator-1')],
  pro: [img('lawyers-1'), img('photographers-1')],
  sales: [img('bulk-materials-1'), img('firewood-sales-1')],
};

const DEFAULT_IMAGES = [img('default-1'), img('default-2')];

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

/** Lightweight SVG thumb for map markers (avoids loading full photos). */
function getMapMarkerImage(category: string, subcategory: string, listingId: string): string {
  const photo = getListingImages(category, subcategory, listingId)[0] ?? DEFAULT_IMAGES[0]!;
  return listingSvgThumb(photo);
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
  logistics: img('evacuator-1'),
  pro: img('tutors-1'),
};

const FORUM_COVER_FILES: Record<string, string> = {
  construction: 'construction-1',
  plumbing: 'plumbers-1',
  electric: 'electricians-1',
  machinery: 'earthmoving-1',
  septic: 'septic-service-1',
  cleaning: 'waste-1',
  beauty: 'beauty-1',
  general: 'default-1',
  other: 'default-2',
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
  const stem = FORUM_COVER_FILES[slug];
  return stem ? listingStemFile(stem) : DEFAULT_IMAGES[0]!;
}

export {
  getListingImages,
  getMapMarkerImage,
  getCategoryCover,
  getForumCategoryCover,
}
