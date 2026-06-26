import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { removeDistApkDownloads, stashPublicApkDownloads } from './stash-public-apk.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const isBundledHosting = process.env.CAPACITOR_BUNDLED === '1' || process.env.CAPACITOR_BUNDLED === 'true'
const productionEnvPath = path.join(root, '.env.production')
const vkMapsEnvPath = path.join(root, 'deploy', 'vkmaps.env')

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return

  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    process.env[key] = value
  }
}

loadEnvFile(productionEnvPath)
loadEnvFile(vkMapsEnvPath)

if (!process.env.VITE_MAP_TOKEN && process.env.VK_MAPS_API_KEY) {
  process.env.VITE_MAP_TOKEN = process.env.VK_MAPS_API_KEY
}

const sitemap = spawnSync('node', ['scripts/generate-sitemap.mjs'], {
  cwd: root,
  stdio: 'inherit',
})
if (sitemap.status !== 0) {
  process.exit(sitemap.status ?? 1)
}

const versionSync = spawnSync('node', ['scripts/sync-app-version.mjs'], {
  cwd: root,
  stdio: 'inherit',
})
if (versionSync.status !== 0) {
  process.exit(versionSync.status ?? 1)
}

const siteVersionSync = spawnSync('node', ['scripts/sync-site-version.mjs', '--bump'], {
  cwd: root,
  stdio: 'inherit',
})
if (siteVersionSync.status !== 0) {
  process.exit(siteVersionSync.status ?? 1)
}

process.env.VITE_BASE = process.env.VITE_BASE ?? '/'
process.env.VITE_API_URL = process.env.VITE_API_URL ?? '/api'

if (process.env.VITE_USE_MOCK_FALLBACK === undefined) {
  const apiUrl = process.env.VITE_API_URL ?? ''
  process.env.VITE_USE_MOCK_FALLBACK = apiUrl.startsWith('http') ? 'false' : 'true'
}

console.log(`Сборка для хостинга: base=${process.env.VITE_BASE}, api=${process.env.VITE_API_URL}`)

const apkStash = isBundledHosting ? stashPublicApkDownloads() : null
if (apkStash?.stashed.length) {
  console.log(`Bundled: временно убраны APK из public/downloads (${apkStash.stashed.join(', ')})`)
}

try {
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

const apkSrc = path.join(root, 'public', 'downloads', 'nagaevomaster.apk')
const apkDst = path.join(root, 'dist', 'downloads', 'nagaevomaster.apk')
if (!isBundledHosting && existsSync(apkSrc)) {
  mkdirSync(path.dirname(apkDst), { recursive: true })
  copyFileSync(apkSrc, apkDst)
  console.log('Скопирован APK в dist/downloads/nagaevomaster.apk')
}

const appVersionPath = path.join(root, 'public', 'app-version.json')
if (!isBundledHosting && existsSync(appVersionPath)) {
  const appVersion = JSON.parse(readFileSync(appVersionPath, 'utf8'))
  const versionedName = typeof appVersion.apkFileName === 'string'
    ? appVersion.apkFileName
    : `nagaevomaster-${appVersion.version ?? '0.0.0'}.apk`
  const versionedSrc = path.join(root, 'public', 'downloads', versionedName)
  const versionedDst = path.join(root, 'dist', 'downloads', versionedName)
  if (existsSync(versionedSrc)) {
    mkdirSync(path.dirname(versionedDst), { recursive: true })
    copyFileSync(versionedSrc, versionedDst)
    console.log(`Скопирован APK в dist/downloads/${versionedName}`)
  }
}

if (isBundledHosting) {
  const removed = removeDistApkDownloads()
  if (removed > 0) {
    console.log(`Bundled: удалены ${removed} APK из dist/downloads (не вшиваем в приложение)`)
  }
}
} finally {
  apkStash?.restore()
}
