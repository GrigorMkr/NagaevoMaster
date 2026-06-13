const LISTING_IMAGE_BASE = `${import.meta.env.BASE_URL}listings`.replace(/\/{2,}/g, '/');

function localImage(name: string): string {
  return `${LISTING_IMAGE_BASE}/${name}`.replace(/\/{2,}/g, '/');
}

const SUBCATEGORY_IMAGES: Record<string, string[]> = {
  electricians: [
    localImage('electricians-1.svg'),
    localImage('electricians-2.svg'),
  ],
  'agri-machinery': [
    localImage('agri-machinery-1.svg'),
    localImage('agri-machinery-2.svg'),
  ],
  earthmoving: [
    localImage('earthmoving-1.svg'),
    localImage('earthmoving-2.svg'),
  ],
  hairdresser: [
    localImage('hairdresser-1.svg'),
    localImage('hairdresser-2.svg'),
  ],
  barber: [
    localImage('barber-1.svg'),
    localImage('barber-2.svg'),
  ],
  nails: [
    localImage('nails-1.svg'),
    localImage('nails-2.svg'),
  ],
  roofers: [
    localImage('roofers-1.svg'),
    localImage('roofers-2.svg'),
  ],
  plumbers: [
    localImage('plumbers-1.svg'),
    localImage('plumbers-2.svg'),
  ],
  'septic-service': [
    localImage('septic-service-1.svg'),
  ],
  mowing: [
    localImage('mowing-1.svg'),
    localImage('mowing-2.svg'),
  ],
  cleaners: [
    localImage('cleaners-1.svg'),
  ],
  'country-move': [
    localImage('country-move-1.svg'),
  ],
  plowing: [
    localImage('plowing-1.svg'),
  ],
  lawyers: [
    localImage('lawyers-1.svg'),
  ],
  'firewood-sales': [
    localImage('firewood-sales-1.svg'),
  ],
  water: [
    localImage('water-1.svg'),
  ],
  waste: [
    localImage('waste-1.svg'),
  ],
  gardeners: [
    localImage('gardeners-1.svg'),
  ],
  glazing: [
    localImage('glazing-1.svg'),
  ],
  evacuator: [
    localImage('evacuator-1.svg'),
  ],
  'septic-install': [
    localImage('septic-install-1.svg'),
  ],
  tutors: [
    localImage('tutors-1.svg'),
  ],
  'bulk-materials': [
    localImage('bulk-materials-1.svg'),
  ],
  builders: [
    localImage('builders-1.svg'),
    localImage('builders-2.svg'),
  ],
  photographers: [
    localImage('photographers-1.svg'),
  ],
};

const CATEGORY_IMAGES: Record<string, string[]> = {
  construction: [
    localImage('construction-1.svg'),
    localImage('construction-2.svg'),
  ],
  machinery: [
    localImage('machinery-1.svg'),
    localImage('agri-machinery-1.svg'),
  ],
  utility: [
    localImage('utility-1.svg'),
    localImage('septic-service-1.svg'),
  ],
  beauty: [
    localImage('beauty-1.svg'),
    localImage('beauty-2.svg'),
  ],
  farming: [
    localImage('farming-1.svg'),
    localImage('farming-2.svg'),
  ],
  staff: [
    localImage('cleaners-1.svg'),
    localImage('gardeners-1.svg'),
  ],
  logistics: [
    localImage('country-move-1.svg'),
    localImage('evacuator-1.svg'),
  ],
  pro: [
    localImage('lawyers-1.svg'),
    localImage('photographers-1.svg'),
  ],
  sales: [
    localImage('bulk-materials-1.svg'),
    localImage('firewood-sales-1.svg'),
  ],
};

const DEFAULT_IMAGES = [
  localImage('default-1.svg'),
  localImage('default-2.svg'),
];

function getListingImages(category: string, subcategory: string, listingId: string): string[] {
  const specific = SUBCATEGORY_IMAGES[subcategory];
  const pool = specific?.length
    ? specific
    : CATEGORY_IMAGES[category]?.length
      ? CATEGORY_IMAGES[category]
      : DEFAULT_IMAGES;

  const seed = Number.parseInt(listingId, 10) || listingId.charCodeAt(0);
  const offset = seed % pool.length;
  const primary = pool[offset];
  const secondary = pool[(offset + 1) % pool.length];

  return primary === secondary ? [primary] : [primary, secondary];
}

export {
  getListingImages,
}
