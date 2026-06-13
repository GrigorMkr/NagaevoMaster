const LISTING_IMAGE_BASE = `${import.meta.env.BASE_URL || '/'}`.replace(/\/$/, '') + '/listings';

function listingAsset(fileName: string): string {
  return `${LISTING_IMAGE_BASE}/${fileName}`.replace(/\/{2,}/g, '/');
}

/** Stems that ship as PNG only (no JPG duplicate). */
const PNG_ONLY_STEMS = new Set([
  'agri-machinery-1',
  'machinery-1',
  'farming-1',
  'utility-1',
  'water-1',
  'default-2',
  'bulk-materials-1',
]);

function listingStemFile(stem: string): string {
  const ext = PNG_ONLY_STEMS.has(stem) ? 'png' : 'jpg';
  return listingAsset(`${stem}.${ext}`);
}

function listingFallbackChain(src: string): string[] {
  const fileName = src.split('/').pop();
  if (!fileName) {
    return [src];
  }

  const match = fileName.match(/^(.+)-(\d+)\.(\w+)$/i);
  if (!match) {
    return [src];
  }

  const [, stem, variant] = match;
  if (!stem || !variant) {
    return [src];
  }

  const base = src.slice(0, src.length - fileName.length) + `${stem}-${variant}`;
  const stemKey = `${stem}-${variant}`;
  const preferred = PNG_ONLY_STEMS.has(stemKey) ? 'png' : 'jpg';
  const order = new Set<string>([preferred, 'jpg', 'png', 'webp', 'svg']);

  return [...order].map((ext) => `${base}.${ext}`);
}

function listingSvgThumb(src: string): string {
  return src.replace(/\.(jpg|jpeg|png|webp)$/i, '.svg');
}

export {
  listingAsset,
  listingFallbackChain,
  listingStemFile,
  listingSvgThumb,
  LISTING_IMAGE_BASE,
};
