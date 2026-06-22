import { ROUTES } from './routes';
const HEADER_NAV_ITEMS = [
    { to: ROUTES.HOME, label: 'Главная' },
    { to: ROUTES.SERVICES, label: 'Услуги' },
    { to: ROUTES.BOARD, label: 'Доска' },
    { to: ROUTES.FORUM, label: 'Форум' },
    { to: ROUTES.NEWS, label: 'Новости' },
] as const;
const FOOTER_NAV_ITEMS = [
    { to: ROUTES.SERVICES, label: 'Услуги' },
    { to: ROUTES.BOARD, label: 'Доска' },
    { to: ROUTES.FORUM, label: 'Форум' },
    { to: ROUTES.NEWS, label: 'Новости' },
    { to: ROUTES.SEARCH, label: 'Поиск' },
    { to: ROUTES.ABOUT, label: 'О проекте' },
    { to: ROUTES.CONTACT, label: 'Контакты' },
    { to: ROUTES.APP_DOWNLOAD, label: 'Скачать' },
] as const;

export {
  HEADER_NAV_ITEMS,
  FOOTER_NAV_ITEMS,
}
