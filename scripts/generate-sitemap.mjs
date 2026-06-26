/**
 * Генерация public/sitemap.xml для Google и Яндекса.
 *
 *   npm run seo:sitemap
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = 'https://nagaevomaster.ru';
const today = new Date().toISOString().slice(0, 10);

function readProjectFile(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function extractServiceCategorySlugs(source) {
  const section = source.split('const SERVICE_CATEGORIES')[1]?.split('const FORUM_CATEGORIES')[0] ?? '';
  return [...section.matchAll(/^\s{8}slug: '([^']+)',$/gm)].map((match) => match[1]);
}

function extractBeautySubcategorySlugs(source) {
  const beautyBlock = source.match(/slug: 'beauty',[\s\S]*?subcategories: \[([\s\S]*?)\n\s{4}\],/)?.[1] ?? '';
  return [...beautyBlock.matchAll(/slug: '([^']+)'/g)].map((match) => match[1]);
}

function extractForumCategorySlugs(source) {
  const section = source.split('const FORUM_CATEGORIES')[1]?.split('function getCategoryBySlug')[0] ?? '';
  return [...section.matchAll(/slug: '([^']+)'/g)].map((match) => match[1]);
}

function extractBoardKinds(source) {
  return [...source.matchAll(/^\s+kind: '([^']+)',$/gm)].map((match) => match[1]);
}

function urlEntry(loc, { changefreq = 'weekly', priority = '0.6' } = {}) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const categoriesSource = readProjectFile('src/data/categories.ts');
const boardSource = readProjectFile('src/data/boardKinds.ts');

const serviceSlugs = extractServiceCategorySlugs(categoriesSource);
const beautySubSlugs = extractBeautySubcategorySlugs(categoriesSource);
const forumSlugs = extractForumCategorySlugs(categoriesSource);
const boardKinds = extractBoardKinds(boardSource);

const urls = [
  urlEntry(`${siteUrl}/`, { changefreq: 'daily', priority: '1.0' }),
  urlEntry(`${siteUrl}/services`, { priority: '0.9' }),
  urlEntry(`${siteUrl}/search`, { priority: '0.8' }),
  urlEntry(`${siteUrl}/board`, { priority: '0.8' }),
  urlEntry(`${siteUrl}/forum`, { priority: '0.8' }),
  urlEntry(`${siteUrl}/news`, { priority: '0.7' }),
  urlEntry(`${siteUrl}/about`, { priority: '0.7' }),
  urlEntry(`${siteUrl}/contact`, { priority: '0.6' }),
  urlEntry(`${siteUrl}/app`, { priority: '0.7' }),
  urlEntry(`${siteUrl}/privacy`, { changefreq: 'monthly', priority: '0.5' }),
  urlEntry(`${siteUrl}/personal-data`, { changefreq: 'monthly', priority: '0.5' }),
  urlEntry(`${siteUrl}/terms`, { changefreq: 'monthly', priority: '0.5' }),
  ...serviceSlugs.map((slug) => urlEntry(`${siteUrl}/services/${slug}`, { priority: '0.8' })),
  ...beautySubSlugs.map((slug) => urlEntry(`${siteUrl}/services/beauty/${slug}`, { priority: '0.7' })),
  ...forumSlugs.map((slug) => urlEntry(`${siteUrl}/forum/${slug}`, { priority: '0.7' })),
  ...boardKinds.map((kind) => urlEntry(`${siteUrl}/board/${kind}`, { priority: '0.7' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

const outPath = path.join(root, 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log(`sitemap.xml: ${urls.length} URL → ${path.relative(root, outPath)}`);
