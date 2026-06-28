import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { removeDistApkDownloads, stashPublicApkDownloads } from './stash-public-apk.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const isBundledHosting = process.env.CAPACITOR_BUNDLED === '1' || process.env.CAPACITOR_BUNDLED === 'true'
const productionEnvPath = path.join(root, '.env.production')
const vkMapsEnvPath = path.join(root, 'deploy', 'vkmaps.env')
const vkWidgetsEnvPath = path.join(root, 'deploy', 'vkwidgets.env')
const oauthEnvPath = path.join(root, 'deploy', 'oauth.env')

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
loadEnvFile(oauthEnvPath)
loadEnvFile(vkMapsEnvPath)
loadEnvFile(vkWidgetsEnvPath)

if (!process.env.VITE_MAP_TOKEN && process.env.VK_MAPS_API_KEY) {
  process.env.VITE_MAP_TOKEN = process.env.VK_MAPS_API_KEY
}

if (!process.env.VITE_VK_WIDGETS_API_ID && process.env.VK_WIDGETS_API_ID) {
  process.env.VITE_VK_WIDGETS_API_ID = process.env.VK_WIDGETS_API_ID
}
if (!process.env.VITE_VK_WIDGETS_API_ID && process.env.VK_CLIENT_ID) {
  process.env.VITE_VK_WIDGETS_API_ID = process.env.VK_CLIENT_ID
}

const vkWidgetEnvMap = [
  ['VITE_VK_COMMUNITY_ID', 'VK_COMMUNITY_ID'],
  ['VITE_VK_VIDEO_URL', 'VK_VIDEO_URL'],
  ['VITE_VK_VIDEO_OID', 'VK_VIDEO_OID'],
  ['VITE_VK_VIDEO_ID', 'VK_VIDEO_ID'],
  ['VITE_VK_VIDEO_HASH', 'VK_VIDEO_HASH'],
  ['VITE_VK_VIDEO_HD', 'VK_VIDEO_HD'],
  ['VITE_VK_VIDEO_AUTOPLAY', 'VK_VIDEO_AUTOPLAY'],
  ['VITE_VK_VIDEO_LOOP', 'VK_VIDEO_LOOP'],
  ['VITE_VK_VIDEO_START', 'VK_VIDEO_START'],
  ['VITE_VK_WALL_POST_OWNER_ID', 'VK_WALL_POST_OWNER_ID'],
  ['VITE_VK_WALL_POST_ID', 'VK_WALL_POST_ID'],
  ['VITE_VK_WALL_POST_HASH', 'VK_WALL_POST_HASH'],
  ['VITE_VK_CONTACT_US_TEXT', 'VK_CONTACT_US_TEXT'],
]

for (const [viteKey, deployKey] of vkWidgetEnvMap) {
  if (!process.env[viteKey] && process.env[deployKey]) {
    process.env[viteKey] = process.env[deployKey]
  }
}

if (isBundledHosting && !process.env.VITE_MAP_TOKEN?.trim()) {
  console.warn(`
⚠ VK Карты: deploy/vkmaps.env не задан (VK_MAPS_API_KEY).
  Карта в bundled APK не загрузится без ключа.
  cp deploy/vkmaps.env.example deploy/vkmaps.env
`)
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
