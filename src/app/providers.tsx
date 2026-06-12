import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { store } from './store'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: 'inherit',
              },
            }}
          />
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  )
}
