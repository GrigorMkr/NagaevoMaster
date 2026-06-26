import type { AppIconName } from '@/types/icon';
import { ROUTES } from '@/constants';

const PORTAL_TICKER = [
  'бесплатно',
  'без подписок',
  'для своих',
  'Нагаево',
  'открыто',
  'честно',
  'навсегда',
] as const;

interface PortalCapability {
  icon: AppIconName;
  title: string;
  text: string;
  to: string;
  accent: string;
  accent2: string;
  glow: string;
}

const PORTAL_CAPABILITIES: PortalCapability[] = [
  {
    icon: 'users',
    title: 'Мастера и услуги',
    text: 'Электрики, строители, техника — рядом с домом, с отзывами соседей.',
    to: ROUTES.SERVICES,
    accent: '#7ec8a8',
    accent2: '#2d9a74',
    glow: 'rgba(126, 200, 168, 0.35)',
  },
  {
    icon: 'messages',
    title: 'Общение',
    text: 'Чаты, сообщества, фото и файлы — говорите прямо здесь.',
    to: ROUTES.PROFILE,
    accent: '#5eb8ff',
    accent2: '#3a8fd4',
    glow: 'rgba(94, 184, 255, 0.32)',
  },
  {
    icon: 'shopping',
    title: 'Покупка и продажа',
    text: 'Доска: товары, услуги, аренда — без посредников.',
    to: ROUTES.BOARD,
    accent: '#e8b84a',
    accent2: '#c9952e',
    glow: 'rgba(232, 184, 74, 0.35)',
  },
  {
    icon: 'megaphone',
    title: 'Форум посёлка',
    text: 'Вопросы, советы, взаимопомощь — живое сообщество.',
    to: ROUTES.FORUM,
    accent: '#e8a87c',
    accent2: '#d4885a',
    glow: 'rgba(232, 168, 124, 0.3)',
  },
  {
    icon: 'heart',
    title: 'Друзья и отзывы',
    text: 'Знакомые, репосты объявлений, оценки мастеров.',
    to: ROUTES.PROFILE,
    accent: '#f08a7e',
    accent2: '#d46558',
    glow: 'rgba(240, 138, 126, 0.3)',
  },
  {
    icon: 'smartphone',
    title: 'Сайт и приложение',
    text: 'Браузер и телефон — открыли и пользуетесь.',
    to: ROUTES.APP_DOWNLOAD,
    accent: '#2d9a74',
    accent2: '#7ec8a8',
    glow: 'rgba(45, 154, 116, 0.32)',
  },
];

export {
  PORTAL_TICKER,
  PORTAL_CAPABILITIES,
};

export type {
  PortalCapability,
};
