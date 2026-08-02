import { HAS_REMOTE_API, TRY_LOCAL_API } from '@/config/runtime';
import { isGitHubPagesHost } from '@/utils/demoHost';

let cachedAvailability: boolean | null = null;
let inflightProbe: Promise<boolean> | null = null;

async function probeLocalApi(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return true;
  }

  // GitHub Pages demo: no backend — use mocks immediately
  if (isGitHubPagesHost()) {
    cachedAvailability = false;
    return false;
  }

  if (!import.meta.env.DEV || HAS_REMOTE_API) {
    return true;
  }

  if (!TRY_LOCAL_API) {
    cachedAvailability = false;
    return false;
  }

  if (cachedAvailability !== null) {
    return cachedAvailability;
  }

  if (!inflightProbe) {
    inflightProbe = fetch('/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(1200),
    })
      .then((response) => response.ok)
      .catch(() => false)
      .then((available) => {
        cachedAvailability = available;
        return available;
      })
      .finally(() => {
        inflightProbe = null;
      });
  }

  return inflightProbe;
}

function isLocalApiKnownUnavailable(): boolean {
  return (import.meta.env.DEV && !HAS_REMOTE_API && cachedAvailability === false)
    || isGitHubPagesHost();
}

function resetLocalApiProbe(): void {
  cachedAvailability = null;
  inflightProbe = null;
}

export {
  probeLocalApi,
  isLocalApiKnownUnavailable,
  resetLocalApiProbe,
};
