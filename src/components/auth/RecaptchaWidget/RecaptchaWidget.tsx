import { useEffect, useId, useRef, useState } from 'react';
import styles from './RecaptchaWidget.module.css';

interface Grecaptcha {
  ready: (callback: () => void) => void;
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const SCRIPT_ID = 'google-recaptcha-script';
let scriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('reCAPTCHA недоступна'));
  }
  if (window.grecaptcha) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Не удалось загрузить reCAPTCHA')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить reCAPTCHA'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface RecaptchaWidgetProps {
  siteKey: string;
  onChange: (token: string | null) => void;
  onReady?: () => void;
}

interface RecaptchaWidgetHandle {
  reset: () => void;
}

function RecaptchaWidget({ siteKey, onChange, onReady }: RecaptchaWidgetProps) {
  const containerId = useId().replace(/:/g, '');
  const widgetIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const [loadError, setLoadError] = useState<string | null>(null);

  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    void loadRecaptchaScript()
      .then(() => {
        if (cancelled || !window.grecaptcha) return undefined;

        return new Promise<void>((resolve) => {
          window.grecaptcha!.ready(() => resolve());
        });
      })
      .then(() => {
        if (cancelled || !window.grecaptcha) return;

        const container = document.getElementById(containerId);
        if (!container || widgetIdRef.current !== null) return;

        widgetIdRef.current = window.grecaptcha.render(container, {
          sitekey: siteKey,
          callback: (token) => onChangeRef.current(token),
          'expired-callback': () => onChangeRef.current(null),
          'error-callback': () => onChangeRef.current(null),
        });
        onReady?.();
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Ошибка загрузки капчи');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [containerId, onReady, siteKey]);

  if (loadError) {
    return <p className={styles.recaptchaError}>{loadError}</p>;
  }

  return (
    <div className={styles.recaptcha}>
      <div id={containerId} />
    </div>
  );
}

export {
  RecaptchaWidget,
};

export type {
  RecaptchaWidgetHandle,
};
