export enum NewsCategory {
  Local = 'local',
  External = 'external',
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  [NewsCategory.Local]: 'Нагаево',
  [NewsCategory.External]: 'Регион',
}
