const COMMUNITY_RULES = [
  'Запрещены нецензурная брань, оскорбления и унижение других пользователей.',
  'Запрещены пропаганда, разжигание ненависти, обсуждение войны и СВО.',
  'Запрещены реклама и продажа наркотиков, психотропов и иных запрещённых веществ.',
  'Запрещены спам, мошенничество, порнография и нелегальные услуги.',
  'Объявления должны относиться к услугам в радиусе 50 км от Нагаево.',
  'За грубые или повторные нарушения аккаунт блокируется навсегда.',
] as const;

const BAN_POLICY_TEXT =
  'За публикацию мата, пропаганды, рекламы наркотиков и иных грубых нарушений правил ' +
  'модератор вправе отклонить материал и заблокировать пользователя без возможности восстановления.';

const CONTENT_VIOLATION_MESSAGE =
  'Текст нарушает правила платформы. За грубые нарушения возможен перманентный бан.';

const PROFANITY_PATTERNS = [
  /\bхуй\w*/i,
  /\bпизд\w*/i,
  /\bеба?т\w*/i,
  /\bёба?т\w*/i,
  /\bбля\w*/i,
  /\bсука\b/i,
  /\bмудак\w*/i,
  /\bпидор\w*/i,
  /\bпедик\w*/i,
  /\bзалуп\w*/i,
  /\bгандон\w*/i,
];

const WAR_PATTERNS = [
  /\bсво\b/i,
  /специальн\w*\s+военн\w*\s+операц/i,
  /военн\w*\s+операц\w*\s+на\s+украин/i,
  /разжиган\w*\s+ненавист/i,
];

const DRUG_PATTERNS = [
  /наркот/i,
  /героин/i,
  /кокаин/i,
  /мефедрон/i,
  /амфетамин/i,
  /марихуан/i,
  /каннабис/i,
  /спайс/i,
  /психотроп/i,
];

const ALL_CONTENT_PATTERNS = [...PROFANITY_PATTERNS, ...WAR_PATTERNS, ...DRUG_PATTERNS];

function normalizeContentText(text: string): string {
  return text.toLowerCase().replace(/[ё]/g, 'е');
}

function hasForbiddenContent(text: string): boolean {
  const normalized = normalizeContentText(text);
  return ALL_CONTENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function validateUserContent(...parts: Array<string | undefined | null>): string | null {
  const combined = parts.filter(Boolean).join('\n').trim();
  if (!combined) {
    return null;
  }
  return hasForbiddenContent(combined) ? CONTENT_VIOLATION_MESSAGE : null;
}

const LISTING_PUBLISH_TERMS_LABEL =
  'С условиями размещения объявления ознакомлен(а) и согласен(на)';

export {
  COMMUNITY_RULES,
  BAN_POLICY_TEXT,
  CONTENT_VIOLATION_MESSAGE,
  LISTING_PUBLISH_TERMS_LABEL,
  validateUserContent,
};
