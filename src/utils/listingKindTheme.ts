import type { ListingKind } from '@/types/listing';

interface ListingKindTheme {
  icon: string;
  shortLabel: string;
}

const LISTING_KIND_THEMES: Record<ListingKind, ListingKindTheme> = {
  service: {
    icon: '🛠',
    shortLabel: 'Услуга',
  },
  sale: {
    icon: '🛒',
    shortLabel: 'Барахолка',
  },
  vacancy: {
    icon: '💼',
    shortLabel: 'Вакансия',
  },
  lost: {
    icon: '🧭',
    shortLabel: 'Потеряшка',
  },
};

function resolveListingKind(kind?: ListingKind): ListingKind {
  return kind ?? 'service';
}

function getListingKindTheme(kind?: ListingKind): ListingKindTheme {
  return LISTING_KIND_THEMES[resolveListingKind(kind)];
}

export {
  LISTING_KIND_THEMES,
  resolveListingKind,
  getListingKindTheme,
};

export type {
  ListingKindTheme,
};
