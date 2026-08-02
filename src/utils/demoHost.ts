/** GitHub Pages demo host — no backend API available */
function isGitHubPagesHost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname.endsWith('github.io');
}

export {
  isGitHubPagesHost,
}
