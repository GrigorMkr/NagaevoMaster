/**
 * Ждёт поднятия API на Render, затем пересобирает и заливает фронт на REG.RU.
 * Запуск: npm run deploy:full
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HEALTH_URL = process.env.RENDER_HEALTH_URL ?? 'https://nagaevomaster-api.onrender.com/api/health'
const MAX_ATTEMPTS = Number(process.env.WAIT_API_ATTEMPTS ?? 40)
const INTERVAL_MS = Number(process.env.WAIT_API_INTERVAL_MS ?? 15_000)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForApi() {
  console.log(`Ожидание API: ${HEALTH_URL}`)
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(20_000) })
      if (response.ok) {
        const body = await response.json().catch(() => ({}))
        if (body?.status === 'ok' || body?.service === 'nagaevomaster-api') {
          console.log(`API готов (попытка ${attempt}/${MAX_ATTEMPTS})`)
          return true
        }
      }
      console.log(`Попытка ${attempt}/${MAX_ATTEMPTS}: HTTP ${response.status}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(`Попытка ${attempt}/${MAX_ATTEMPTS}: ${message}`)
    }
    if (attempt < MAX_ATTEMPTS) {
      await sleep(INTERVAL_MS)
    }
  }
  return false
}

function runNpm(script) {
  const result = spawnSync('npm', ['run', script], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const ready = await waitForApi()
if (!ready) {
  console.error('\nAPI не ответил вовремя.')
  console.error('Создайте Blueprint на Render:')
  console.error('https://render.com/deploy?repo=https://github.com/GrigorMkr/NagaevoMaster')
  process.exit(1)
}

console.log('\nПересборка фронтенда с VITE_USE_MOCK_FALLBACK=false…')
runNpm('build:hosting')
console.log('\nЗагрузка на REG.RU…')
runNpm('deploy:hosting')
console.log('\nГотово: https://nagaevomaster.ru')
