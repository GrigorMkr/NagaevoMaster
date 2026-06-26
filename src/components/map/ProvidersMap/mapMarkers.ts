function escapeMarkerHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createCenterMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'mapCenterMarker';
  el.innerHTML = '<span aria-hidden="true"></span>';
  return el;
}

const listingMarkerCache = new Map<string, HTMLDivElement>();

function createListingMarkerElement(imageUrl: string): HTMLDivElement {
  const cached = listingMarkerCache.get(imageUrl);
  if (cached) {
    return cached.cloneNode(true) as HTMLDivElement;
  }

  const el = document.createElement('div');
  el.className = 'mapListingMarker';
  const safeUrl = escapeMarkerHtml(imageUrl);
  el.innerHTML = `<div class="mapListingMarkerInner"><img src="${safeUrl}" alt="" loading="lazy" decoding="async" /></div>`;
  listingMarkerCache.set(imageUrl, el);
  return el.cloneNode(true) as HTMLDivElement;
}

function createUserLocationElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '20px';
  el.style.height = '20px';
  el.style.borderRadius = '50%';
  el.style.background = '#2d9a74';
  el.style.border = '2px solid #17624a';
  el.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.9)';
  return el;
}

export {
  createCenterMarkerElement,
  createListingMarkerElement,
  createUserLocationElement,
};
