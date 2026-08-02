/** Static files from /public with correct base for GitHub Pages */
function publicUrl(path: string): string {
  if (!path) return path
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export {
  publicUrl,
}
