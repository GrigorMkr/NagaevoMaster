/**
 * Prefix static /public paths with Vite `base` (e.g. /NagaevoMaster/ on GitHub Pages).
 * Keep this tiny and side-effect free so the bundler can inline call sites.
 */
const APP_BASE = String(import.meta.env.BASE_URL || '/').replace(/\/$/, '');

function publicUrl(path: string): string {
  if (!path) return path;
  if (/^(?:https?:|data:)/i.test(path)) return path;
  return `${APP_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export {
  APP_BASE,
  publicUrl,
};
