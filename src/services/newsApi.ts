import { NEWS_LOCAL_LIMIT, NEWS_SUMMARY_MAX_LENGTH } from '@/constants';
import type { NewsCategory, NewsItem } from '@/types/news';
import { ensureHttpsUrl } from '@/utils/secureUrl';
import { NAGAEVO_ARTICLE_IMAGES, REAL_EXTERNAL_NEWS, REAL_LOCAL_NEWS, } from '@/data/realNews';
const SKIP_TITLE_RE = /#СВО|Меганом|Таврида/i;
function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
function articlePath(url: string): string {
    try {
        return new URL(url).pathname;
    }
    catch {
        return url;
    }
}
function imageForArticle(url: string): string | undefined {
  const mapped = NAGAEVO_ARTICLE_IMAGES[articlePath(url)];
  return mapped ? ensureHttpsUrl(mapped) : undefined;
}

function extractImageFromDescription(html: string): string {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ? ensureHttpsUrl(match[1]) : '';
}
function parseRssItems(xml: string, category: NewsCategory, sourceName: string): NewsItem[] {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const items = Array.from(doc.querySelectorAll('item'));
    return items
        .map((item, index) => {
        const title = item.querySelector('title')?.textContent?.trim() ?? '';
        const link = item.querySelector('link')?.textContent?.trim() ?? '';
        const pubDate = item.querySelector('pubDate')?.textContent?.trim() ?? new Date().toISOString();
        const description = item.querySelector('description')?.textContent?.trim() ??
            item.querySelector('content\\:encoded, encoded')?.textContent?.trim() ??
            '';
        if (!title || !link || SKIP_TITLE_RE.test(title)) {
            return null;
        }
        const summary = stripHtml(description).slice(0, NEWS_SUMMARY_MAX_LENGTH);
        const id = `${category}-${articlePath(link).replace(/\W/g, '') || index}`;
        const imageUrl = ensureHttpsUrl(
          imageForArticle(link) ?? extractImageFromDescription(description) ?? '',
        );
        return {
            id,
            title,
            summary: summary.length > 0 ? `${summary}…` : title,
            imageUrl,
            sourceUrl: ensureHttpsUrl(link),
            sourceName,
            publishedAt: new Date(pubDate).toISOString(),
            category,
        };
    })
        .filter((item): item is NewsItem => item !== null);
}
function enrichWithLocalImages(items: NewsItem[]): NewsItem[] {
    const usedImages = new Set<string>();
    const enriched: NewsItem[] = [];
    for (const item of items) {
        let imageUrl = item.imageUrl || imageForArticle(item.sourceUrl);
        if (!imageUrl) {
            imageUrl = REAL_LOCAL_NEWS.find((n) => n.sourceUrl === item.sourceUrl)?.imageUrl;
        }
        if (!imageUrl || usedImages.has(imageUrl))
            continue;
        usedImages.add(imageUrl);
        enriched.push({ ...item, imageUrl: ensureHttpsUrl(imageUrl) });
    }
    return enriched;
}
async function fetchRssFeed(feedUrl: string, category: NewsCategory, sourceName: string): Promise<NewsItem[]> {
    const response = await fetch(feedUrl);
    if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status}`);
    }
    const xml = await response.text();
    const items = parseRssItems(xml, category, sourceName);
    if (items.length === 0) {
        throw new Error('RSS parse returned no items');
    }
    return enrichWithLocalImages(items);
}
function mergeWithReal(live: NewsItem[], real: NewsItem[], limit: number): NewsItem[] {
    const byUrl = new Map(real.map((item) => [item.sourceUrl, item]));
    const usedImages = new Set<string>();
    const result: NewsItem[] = [];
    for (const item of live) {
        const known = byUrl.get(item.sourceUrl);
        const merged: NewsItem = known
            ? {
              ...item,
              imageUrl: ensureHttpsUrl(known.imageUrl),
              summary: item.summary || known.summary,
            }
            : { ...item, imageUrl: ensureHttpsUrl(item.imageUrl) };
        if (!merged.imageUrl || usedImages.has(merged.imageUrl))
            continue;
        usedImages.add(merged.imageUrl);
        result.push(merged);
        if (result.length >= limit)
            return result;
    }
    for (const item of real) {
        if (result.length >= limit)
            break;
        if (result.some((r) => r.sourceUrl === item.sourceUrl))
            continue;
        if (usedImages.has(item.imageUrl))
            continue;
        usedImages.add(item.imageUrl);
        result.push(item);
    }
    return result;
}
async function fetchLocalNews(): Promise<NewsItem[]> {
    const rssUrl = import.meta.env.DEV
        ? '/api/news/category/news/feed/'
        : `${import.meta.env.VITE_API_URL ?? '/api'}/news/feed`;
    try {
        const live = await fetchRssFeed(rssUrl, 'local', 'ДК с. Нагаево');
        return mergeWithReal(live, REAL_LOCAL_NEWS, NEWS_LOCAL_LIMIT);
    }
    catch {
        return REAL_LOCAL_NEWS.slice(0, NEWS_LOCAL_LIMIT);
    }
}
async function fetchExternalNews(): Promise<NewsItem[]> {
    return REAL_EXTERNAL_NEWS;
}
async function fetchAllNews(): Promise<{
    local: NewsItem[];
    external: NewsItem[];
}> {
    const [local, external] = await Promise.all([fetchLocalNews(), fetchExternalNews()]);
    return { local, external };
}

export {
  fetchLocalNews,
  fetchExternalNews,
  fetchAllNews,
}
