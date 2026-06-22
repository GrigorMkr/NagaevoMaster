import type { Listing, ListingKind, PriceUnit } from '@/types/listing';
import { getBoardKindConfig } from '@/data/boardKinds';

function formatListingPrice(listing: Pick<Listing, 'kind' | 'priceFrom' | 'unit'>): string {
  const kind = listing.kind ?? 'service';
  if (kind === 'lost' && listing.priceFrom <= 0) {
    return 'Без награды';
  }
  if (kind === 'vacancy' && listing.unit === 'договор' && listing.priceFrom <= 0) {
    return 'По договорённости';
  }
  if (listing.priceFrom <= 0) {
    return 'Бесплатно';
  }
  const config = getBoardKindConfig(kind);
  if (kind === 'service') {
    return `от ${listing.priceFrom} ₽ / ${listing.unit}`;
  }
  if (listing.unit === 'договор' || listing.unit === 'награда') {
    return `${listing.priceFrom} ₽ · ${listing.unit}`;
  }
  return `${listing.priceFrom} ₽${config ? '' : ` / ${listing.unit}`}`;
}

function kindBadgeLabel(kind?: ListingKind): string | null {
  switch (kind) {
    case 'sale':
      return 'Продажа';
    case 'vacancy':
      return 'Вакансия';
    case 'lost':
      return 'Потеряшка';
    default:
      return null;
  }
}

const BOARD_PRICE_UNITS: PriceUnit[] = ['шт', 'договор', 'награда', 'услуга', 'час', 'день'];

export {
  formatListingPrice,
  kindBadgeLabel,
  BOARD_PRICE_UNITS,
};
