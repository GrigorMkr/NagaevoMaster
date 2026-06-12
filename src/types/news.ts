export type NewsCategory = 'local' | 'external'

export interface NewsItem {
  id: string
  title: string
  summary: string
  imageUrl: string
  sourceUrl: string
  sourceName: string
  publishedAt: string
  category: NewsCategory
}
