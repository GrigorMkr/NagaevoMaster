import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers'
import { isNativeApp } from '@/utils/nativeApp'
import { installNativeNavigation } from '@/utils/nativeNavigation'
import App from '@/App'
import '@/styles/global.css'

if (isNativeApp()) {
  installNativeNavigation()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
