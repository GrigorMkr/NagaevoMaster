import { useLayoutEffect } from 'react';
import { redirectToCanonicalHost } from '@/utils/canonicalSite';

function CanonicalHostRedirect() {
  useLayoutEffect(() => {
    redirectToCanonicalHost();
  }, []);

  return null;
}

export {
  CanonicalHostRedirect,
};
