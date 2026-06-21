import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL ?? 'https://nagaevomaster.ru';

const config: CapacitorConfig = {
  appId: 'ru.nagaevomaster.app',
  appName: 'Нагаево Мастер',
  // Лёгкая оболочка для APK: контент грузится с server.url, не дублируем весь dist (~120 МБ).
  webDir: process.env.CAPACITOR_WEB_DIR ?? 'mobile/capacitor-shell',
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: 'https',
    hostname: 'nagaevomaster.ru',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#081f18',
  },
  ios: {
    backgroundColor: '#081f18',
    contentInset: 'automatic',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
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
