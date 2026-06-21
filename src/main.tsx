import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerNativeOAuthEarlyHandler } from '@/utils/nativeOAuthEarly'
import { AppProviders } from '@/app/providers'
import App from '@/App'
import '@/styles/global.css'

registerNativeOAuthEarlyHandler()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
