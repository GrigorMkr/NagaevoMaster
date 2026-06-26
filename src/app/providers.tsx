import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AccountLocationBootstrap } from '@/components/user/AccountLocationBootstrap';
import { AuthBootstrap } from '@/components/user/AuthBootstrap';
import { NotificationsBootstrap } from '@/components/user/NotificationsBootstrap';
import { PushBootstrap } from '@/components/push/PushBootstrap/PushBootstrap';
import { GlobalChatSync } from '@/components/messages/GlobalChatSync/GlobalChatSync';
import { PresenceBootstrap } from '@/components/user/PresenceBootstrap';
import { LocationPromptBootstrap } from '@/components/location/LocationPromptBootstrap/LocationPromptBootstrap';
import { CanonicalHostRedirect } from '@/components/layout/CanonicalHostRedirect/CanonicalHostRedirect';
import { PerformanceBootstrap } from '@/components/performance/PerformanceBootstrap';
import { NativeAppBootstrap } from '@/components/native/NativeAppBootstrap/NativeAppBootstrap';
import { NativePushPermissionModal } from '@/components/push/NativePushPermissionModal/NativePushPermissionModal';
import { PushPermissionModal } from '@/components/push/PushPermissionModal/PushPermissionModal';
import { BootSplashDismiss } from '@/components/boot/BootSplashDismiss';
import { TOAST_DURATION_MS } from '@/constants';
import { store } from './store';
function AppProviders({ children }: {
    children: React.ReactNode;
}) {
    return (<Provider store={store}>
      <HelmetProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <CanonicalHostRedirect />
          <BootSplashDismiss />
          <PerformanceBootstrap />
          <NativeAppBootstrap />
          <AccountLocationBootstrap />
          <AuthBootstrap />
          <NotificationsBootstrap />
          <PresenceBootstrap />
          <PushBootstrap />
          <NativePushPermissionModal />
          <PushPermissionModal />
          <GlobalChatSync />
          <LocationPromptBootstrap />
          {children}
          <Toaster position="top-right" toastOptions={{
            duration: TOAST_DURATION_MS,
            style: {
                fontFamily: 'inherit',
            },
        }}/>
        </BrowserRouter>
      </HelmetProvider>
    </Provider>);
}

export {
  AppProviders,
}
