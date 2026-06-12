import { useCallback, useState } from 'react';
import { COOKIE_CONSENT_STORAGE_KEY } from '@/constants/cookie-consent';
function readConsentVisibility(): boolean {
    try {
        return localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) !== 'accepted';
    }
    catch {
        return true;
    }
}
function useCookieConsent() {
    const [isVisible, setIsVisible] = useState(readConsentVisibility);
    const handleAccept = useCallback(() => {
        try {
            localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted');
        }
        catch {
            // localStorage may be unavailable in private mode
        }
        setIsVisible(false);
    }, []);
    return { isVisible, handleAccept };
}

export {
  useCookieConsent,
}
