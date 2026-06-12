enum NewsCategory {
    Local = 'local',
    External = 'external'
}
const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
    [NewsCategory.Local]: 'Нагаево',
    [NewsCategory.External]: 'Регион',
};

export {
  NewsCategory,
  NEWS_CATEGORY_LABELS,
}
