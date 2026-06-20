import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AccountLocationBootstrap } from '@/components/user/AccountLocationBootstrap';
import { AuthBootstrap } from '@/components/user/AuthBootstrap';
import { NotificationsBootstrap } from '@/components/user/NotificationsBootstrap';
import { LocationPromptBootstrap } from '@/components/location/LocationPromptBootstrap/LocationPromptBootstrap';
import { TOAST_DURATION_MS } from '@/constants';
import { store } from './store';
function AppProviders({ children }: {
    children: React.ReactNode;
}) {
    return (<Provider store={store}>
      <HelmetProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AccountLocationBootstrap />
          <AuthBootstrap />
          <NotificationsBootstrap />
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
