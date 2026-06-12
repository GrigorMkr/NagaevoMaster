import { GEO } from './geo';
const HOME_STEPS = [
    { num: '01', title: 'Выберите категорию', text: 'Строительство, ремонт, транспорт — всё в одном каталоге.' },
    { num: '02', title: 'Сравните мастеров', text: 'Отзывы, рейтинги и расстояние от вашего дома.' },
    { num: '03', title: 'Свяжитесь напрямую', text: 'Без посредников — общайтесь с исполнителем из Нагаево.' },
] as const;
const HOME_FEATURES = [
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
] as const;
const HERO_SUBTITLE = 'Специалисты, техника и услуги рядом с домом — форум для жителей и дачников';
const FORUM_TOPICS_PREVIEW_COUNT = 5;
const NEWS_PREVIEW_COUNT = 3;

export {
  HOME_STEPS,
  HOME_FEATURES,
  HERO_SUBTITLE,
  FORUM_TOPICS_PREVIEW_COUNT,
  NEWS_PREVIEW_COUNT,
}
