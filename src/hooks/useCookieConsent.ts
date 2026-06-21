import { useCallback, useState } from 'react';
import { hasCookieConsent, saveCookieConsent } from '@/utils/cookieConsentStorage';

function useCookieConsent() {
  const [isVisible, setIsVisible] = useState(() => !hasCookieConsent());

  const handleAccept = useCallback(() => {
    saveCookieConsent();
    setIsVisible(false);
  }, []);

  return { isVisible, handleAccept };
}

export {
  useCookieConsent,
};
