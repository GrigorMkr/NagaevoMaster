import type { ListingKind } from '@/types/listing';

interface BoardCategory {
  slug: string;
  name: string;
  icon: string;
}

interface BoardKindConfig {
  kind: ListingKind;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  glow: string;
  examples: string;
  categories: BoardCategory[];
  defaultUnit: string;
  priceLabel: string;
  addCta: string;
}

const BOARD_KINDS: BoardKindConfig[] = [
  {
    kind: 'sale',
    title: 'Продажа',
    subtitle: 'Барахолка',
    description: 'Машины, дом, мототехника, продукты — всё, что можно продать соседям.',
    icon: '🛒',
    accent: '#e8b84a',
    glow: 'rgba(232, 184, 74, 0.35)',
    examples: 'авто · дом · мото · яйца · сметана',
    categories: [
      { slug: 'auto', name: 'Авто и мото', icon: '🚗' },
      { slug: 'home', name: 'Дом и дача', icon: '🏠' },
      { slug: 'tech', name: 'Техника', icon: '📱' },
      { slug: 'food', name: 'Продукты', icon: '🥚' },
      { slug: 'other', name: 'Разное', icon: '📦' },
    ],
    defaultUnit: 'шт',
    priceLabel: 'Цена',
    addCta: 'Продать',
  },
  {
    kind: 'vacancy',
    title: 'Вакансии',
    subtitle: 'Работа',
    description: 'Ищете сотрудника или работу — разместите объявление здесь.',
    icon: '💼',
    accent: '#5eb8ff',
    glow: 'rgba(94, 184, 255, 0.32)',
    examples: 'подработка · сезон · мастер · офис',
    categories: [
      { slug: 'hiring', name: 'Ищу сотрудника', icon: '📣' },
      { slug: 'job', name: 'Ищу работу', icon: '🔍' },
      { slug: 'part', name: 'Подработка', icon: '⏱' },
      { slug: 'other', name: 'Другое', icon: '💬' },
    ],
    defaultUnit: 'договор',
    priceLabel: 'Оплата',
    addCta: 'Разместить',
  },
  {
    kind: 'lost',
    title: 'Потеряшки',
    subtitle: 'Нашли / потеряли',
    description: 'Питомцы, ключи, карты, документы — помогите вернуть или найти.',
    icon: '🧭',
    accent: '#f08a7e',
    glow: 'rgba(240, 138, 126, 0.32)',
    examples: 'кот · ключи · карта · телефон',
    categories: [
      { slug: 'pets', name: 'Питомцы', icon: '🐾' },
      { slug: 'keys', name: 'Ключи', icon: '🔑' },
      { slug: 'docs', name: 'Документы и карты', icon: '💳' },
      { slug: 'items', name: 'Вещи', icon: '🎒' },
      { slug: 'other', name: 'Другое', icon: '❓' },
    ],
    defaultUnit: 'награда',
    priceLabel: 'Награда',
    addCta: 'Сообщить',
  },
];

const BOARD_KIND_MAP = Object.fromEntries(
  BOARD_KINDS.map((item) => [item.kind, item]),
) as Record<Exclude<ListingKind, 'service'>, BoardKindConfig>;

function getBoardKindConfig(kind: ListingKind): BoardKindConfig | undefined {
  if (kind === 'service') return undefined;
  return BOARD_KIND_MAP[kind];
}

export {
  BOARD_KINDS,
  BOARD_KIND_MAP,
  getBoardKindConfig,
};

export type {
  BoardKindConfig,
  BoardCategory,
};
