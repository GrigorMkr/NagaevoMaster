import type { CapacitorConfig } from '@capacitor/cli';

const isBundled = process.env.CAPACITOR_BUNDLED === '1' || process.env.CAPACITOR_BUNDLED === 'true';
const serverUrl = process.env.CAPACITOR_SERVER_URL ?? 'https://nagaevomaster.ru';
const webDir = isBundled
  ? 'dist'
  : (process.env.CAPACITOR_WEB_DIR ?? 'mobile/capacitor-shell');

const config: CapacitorConfig = {
  appId: 'ru.nagaevomaster.app',
  appName: 'Нагаево Мастер',
  webDir,
  ...(isBundled
    ? {
        // Вшитый сайт: UI из assets, API — по сети на api.nagaevomaster.ru
        server: {
          androidScheme: 'https',
          cleartext: false,
        },
      }
    : {
        // Лёгкая оболочка: контент грузится с server.url (~5 МБ APK)
        server: {
          url: serverUrl,
          cleartext: false,
          androidScheme: 'https',
          hostname: 'nagaevomaster.ru',
        },
      }),
  android: {
    allowMixedContent: false,
    backgroundColor: '#081f18',
    appendUserAgent: 'NagaevoMasterApp',
  },
  ios: {
    backgroundColor: '#081f18',
    contentInset: 'automatic',
    appendUserAgent: 'NagaevoMasterApp',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#081f18',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#081f18',
    },
  },
};

export default config;
