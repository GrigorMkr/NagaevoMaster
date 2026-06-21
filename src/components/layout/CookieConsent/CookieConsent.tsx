import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { COOKIE_CONSENT_FULL_TEXT, COOKIE_CONSENT_SHORT_TEXT } from '@/constants/cookie-consent';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { isNativeApp } from '@/utils/nativeApp';
import styles from './CookieConsent.module.css';
const CookieConsent = memo(function CookieConsent() {
    const { isVisible, handleAccept } = useCookieConsent();
    const [isExpanded, setIsExpanded] = useState(false);
    const handleToggleDetails = useCallback(() => {
        setIsExpanded((current) => !current);
    }, []);
    if (!isVisible || isNativeApp()) {
        return null;
    }
    return (<aside className={styles.banner} role="dialog" aria-labelledby="cookie-consent-title" aria-live="polite">
      <div className={styles.content}>
        <p id="cookie-consent-title" className={styles.text}>
          {COOKIE_CONSENT_SHORT_TEXT}{' '}
          <button type="button" className={styles.detailsToggle} onClick={handleToggleDetails}>
            {isExpanded ? 'Свернуть' : 'Подробнее'}
          </button>
        </p>

        {isExpanded && (<p className={styles.details}>{COOKIE_CONSENT_FULL_TEXT}</p>)}
      </div>

      <Button type="button" size="sm" className={styles.acceptButton} onClick={handleAccept}>
        Принять
      </Button>
    </aside>);
});

export {
  CookieConsent,
}
