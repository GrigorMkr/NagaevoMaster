import { ROUTES } from './routes'

export const HEADER_NAV_ITEMS = [
  { to: ROUTES.HOME, label: 'Главная' },
  { to: ROUTES.SERVICES, label: 'Услуги' },
  { to: ROUTES.FORUM, label: 'Форум' },
  { to: ROUTES.NEWS, label: 'Новости' },
  { to: ROUTES.SEARCH, label: 'Поиск' },
  { to: ROUTES.ABOUT, label: 'О проекте' },
] as const

export const FOOTER_NAV_ITEMS = [
  { to: ROUTES.SERVICES, label: 'Услуги' },
  { to: ROUTES.FORUM, label: 'Форум' },
  { to: ROUTES.NEWS, label: 'Новости' },
  { to: ROUTES.ABOUT, label: 'О проекте' },
  { to: ROUTES.CONTACT, label: 'Контакты' },
] as const
