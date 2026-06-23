import type { ListingKind } from '@/types/listing';
import type { AppIconName } from '@/types/icon';

interface ListingKindTheme {
  icon: AppIconName;
  shortLabel: string;
  accent: string;
  accent2: string;
}

const LISTING_KIND_THEMES: Record<ListingKind, ListingKindTheme> = {
  service: {
    icon: 'wrench',
    shortLabel: 'Услуга',
    accent: '#7ec8a8',
    accent2: '#2d9a74',
  },
  sale: {
    icon: 'shopping',
    shortLabel: 'Барахолка',
    accent: '#f0c14b',
    accent2: '#d4922a',
  },
  vacancy: {
    icon: 'briefcase',
    shortLabel: 'Вакансия',
    accent: '#5eb8ff',
    accent2: '#3a8fd9',
  },
  lost: {
    icon: 'compass',
    shortLabel: 'Потеряшка',
    accent: '#ff9a8b',
    accent2: '#e86a58',
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
