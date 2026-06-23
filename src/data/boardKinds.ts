import type { ListingKind } from '@/types/listing';
import type { AppIconName } from '@/types/icon';

interface BoardCategory {
  slug: string;
  name: string;
  icon: AppIconName;
}

interface BoardKindConfig {
  kind: ListingKind;
  title: string;
  subtitle: string;
  description: string;
  icon: AppIconName;
  accent: string;
  glow: string;
  coverImage: string;
  coverPosition: string;
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
    icon: 'shopping',
    accent: '#e8b84a',
    glow: 'rgba(232, 184, 74, 0.35)',
    coverImage: '/images/board/sale.png',
    coverPosition: 'center 40%',
    examples: 'авто · дом · мото · яйца · сметана',
    categories: [
      { slug: 'auto', name: 'Авто и мото', icon: 'car' },
      { slug: 'home', name: 'Дом и дача', icon: 'home' },
      { slug: 'tech', name: 'Техника', icon: 'smartphone' },
      { slug: 'food', name: 'Продукты', icon: 'package' },
      { slug: 'other', name: 'Разное', icon: 'package' },
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
    icon: 'briefcase',
    accent: '#5eb8ff',
    glow: 'rgba(94, 184, 255, 0.32)',
    coverImage: '/images/board/vacancy.png',
    coverPosition: '18% center',
    examples: 'подработка · сезон · мастер · офис',
    categories: [
      { slug: 'hiring', name: 'Ищу сотрудника', icon: 'megaphone' },
      { slug: 'job', name: 'Ищу работу', icon: 'search' },
      { slug: 'part', name: 'Подработка', icon: 'clock' },
      { slug: 'other', name: 'Другое', icon: 'messages' },
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
    icon: 'compass',
    accent: '#f08a7e',
    glow: 'rgba(240, 138, 126, 0.32)',
    coverImage: '/images/board/lost.png',
    coverPosition: '12% center',
    examples: 'кот · ключи · карта · телефон',
    categories: [
      { slug: 'pets', name: 'Питомцы', icon: 'paw' },
      { slug: 'keys', name: 'Ключи', icon: 'key' },
      { slug: 'docs', name: 'Документы и карты', icon: 'card' },
      { slug: 'items', name: 'Вещи', icon: 'backpack' },
      { slug: 'other', name: 'Другое', icon: 'help' },
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
