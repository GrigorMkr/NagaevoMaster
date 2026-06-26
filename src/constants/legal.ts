import { ROUTES } from './routes';

const LEGAL_DOCUMENTS = [
  {
    slug: 'privacy',
    path: ROUTES.PRIVACY,
    title: 'Политика конфиденциальности',
    shortLabel: 'Политика конфиденциальности',
  },
  {
    slug: 'personal-data',
    path: ROUTES.PERSONAL_DATA,
    title: 'Согласие на обработку персональных данных',
    shortLabel: 'Согласие на обработку ПДн',
  },
  {
    slug: 'terms',
    path: ROUTES.TERMS,
    title: 'Условия использования',
    shortLabel: 'Условия использования',
  },
] as const;

type LegalDocumentSlug = (typeof LEGAL_DOCUMENTS)[number]['slug'];

const REGISTER_LEGAL_CONSENT_LABEL =
  'Я ознакомлен(а) с документами и принимаю Условия использования, даю Согласие на обработку персональных данных.';

export {
  LEGAL_DOCUMENTS,
  REGISTER_LEGAL_CONSENT_LABEL,
};

export type {
  LegalDocumentSlug,
};
