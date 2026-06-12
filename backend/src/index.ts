import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`NagaevoMaster API: http://localhost:${env.PORT}/api/health`)
})
