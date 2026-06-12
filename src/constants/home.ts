import { GEO } from './geo'

export const HOME_STEPS = [
  { num: '01', title: 'Выберите категорию', text: 'Строительство, ремонт, транспорт — всё в одном каталоге.' },
  { num: '02', title: 'Сравните мастеров', text: 'Отзывы, рейтинги и расстояние от вашего дома.' },
  { num: '03', title: 'Свяжитесь напрямую', text: 'Без посредников — общайтесь с исполнителем из Нагаево.' },
] as const

export const HOME_FEATURES = [
  {
    icon: '📍',
    title: 'Локальный поиск',
    text: `Услуги в радиусе ${GEO.radiusKm} км от ${GEO.settlement} — только близкие и доступные специалисты.`,
  },
  {
    icon: '⭐',
    title: 'Проверенные мастера',
    text: 'Отзывы и рейтинги от соседей помогают выбрать надёжного исполнителя.',
  },
  {
    icon: '💬',
    title: 'Форум поселка',
    text: 'Обсуждения, советы и взаимопомощь — живое сообщество Нагаево.',
  },
] as const

export const CATEGORY_CARD_STYLE = {
  '--cat-hue': '#17624a',
  '--cat-grad': 'rgba(23,98,74,0.12)',
} as const

export const HERO_SUBTITLE =
  'Специалисты, техника и услуги рядом с домом — форум для жителей и дачников'

export const FORUM_TOPICS_PREVIEW_COUNT = 5
export const NEWS_PREVIEW_COUNT = 3
