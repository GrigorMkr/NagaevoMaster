import { SiteAccessGate } from '@/components/site/SiteAccessGate'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <SiteAccessGate>
      <AppRoutes />
    </SiteAccessGate>
  )
}

export default App
