type NewsCategory = 'local' | 'external';
interface NewsItem {
    id: string;
    title: string;
    summary: string;
    imageUrl: string;
    sourceUrl: string;
    sourceName: string;
    publishedAt: string;
    category: NewsCategory;
}

export type {
  NewsCategory,
  NewsItem,
}
