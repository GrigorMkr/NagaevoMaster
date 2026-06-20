import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const productionEnvPath = path.join(root, '.env.production')

function loadProductionEnv() {
  if (!existsSync(productionEnvPath)) return

  for (const line of readFileSync(productionEnvPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    process.env[key] = value
  }
}

loadProductionEnv()

process.env.VITE_BASE = process.env.VITE_BASE ?? '/'
process.env.VITE_API_URL = process.env.VITE_API_URL ?? '/api'

if (process.env.VITE_USE_MOCK_FALLBACK === undefined) {
  const apiUrl = process.env.VITE_API_URL ?? ''
  process.env.VITE_USE_MOCK_FALLBACK = apiUrl.startsWith('http') ? 'false' : 'true'
}

console.log(`Сборка для хостинга: base=${process.env.VITE_BASE}, api=${process.env.VITE_API_URL}`)

const build = spawnSync('npm', ['run', 'build'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: true,
})

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const htaccessSrc = path.join(root, 'public', '.htaccess')
const htaccessDst = path.join(root, 'dist', '.htaccess')
if (existsSync(htaccessSrc)) {
  copyFileSync(htaccessSrc, htaccessDst)
  console.log('Скопирован .htaccess для Apache (SPA-маршруты)')
}
