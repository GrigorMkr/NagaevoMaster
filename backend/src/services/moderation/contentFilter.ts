import { HttpError } from '../../middleware/errorHandler.js';

type ViolationCategory = 'profanity' | 'drugs' | 'war' | 'illegal';

interface ContentRule {
  category: ViolationCategory;
  label: string;
  patterns: RegExp[];
}

const CONTENT_RULES: ContentRule[] = [
  {
    category: 'profanity',
    label: 'нецензурная брань',
    patterns: [
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
    ],
  },
  {
    category: 'war',
    label: 'пропаганда и обсуждение войны / СВО',
    patterns: [
      /\bсво\b/i,
      /специальн\w*\s+военн\w*\s+операц/i,
      /военн\w*\s+операц\w*\s+на\s+украин/i,
      /разжиган\w*\s+ненавист/i,
      /нацист\w*\s+украин/i,
      /\bz\b.*\bвойн/i,
    ],
  },
  {
    category: 'drugs',
    label: 'наркотики и запрещённые вещества',
    patterns: [
      /наркот/i,
      /героин/i,
      /кокаин/i,
      /мефедрон/i,
      /амфетамин/i,
      /марихуан/i,
      /каннабис/i,
      /спайс/i,
      /лсд\b/i,
      /экстаз/i,
      /психотроп/i,
      /закладк\w*\s+наркот/i,
    ],
  },
  {
    category: 'illegal',
    label: 'нелегальные товары и услуги',
    patterns: [
      /продам\s+оружи/i,
      /купить\s+оружи/i,
      /взрывчат/i,
      /поддельн\w*\s+документ/i,
      /проституц/i,
    ],
  },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ё]/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
}

function findContentViolations(text: string): string[] {
  const normalized = normalizeText(text);
  const labels = new Set<string>();
  for (const rule of CONTENT_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      labels.add(rule.label);
    }
  }
  return [...labels];
}

function assertCleanContent(...parts: Array<string | undefined | null>): void {
  const combined = parts.filter(Boolean).join('\n').trim();
  if (!combined) {
    return;
  }
  const violations = findContentViolations(combined);
  if (violations.length === 0) {
    return;
  }
  throw new HttpError(
    400,
    `Текст нарушает правила платформы: ${violations.join(', ')}. ` +
      'За грубые нарушения возможен перманентный бан.',
  );
}

export {
  assertCleanContent,
  findContentViolations,
};
