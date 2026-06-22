import { Client, enterPassiveModeIPv4 } from 'basic-ftp'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const envPath = path.join(root, 'deploy.env')

function loadDeployEnv() {
  if (!existsSync(envPath)) {
    console.error('Нет файла deploy.env — скопируйте deploy.env.example и укажите FTP-данные из ISPmanager.')
    process.exit(1)
  }

  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return env
}

async function resolveRemoteDir(client, preferred) {
  const candidates = [
    preferred,
    preferred.replace(/^\//, ''),
    'www/nagaevomaster.ru/data',
    '/www/nagaevomaster.ru/data',
    'data',
    '/data',
  ].filter((value, index, list) => value && list.indexOf(value) === index)

  for (const candidate of candidates) {
    try {
      await client.ensureDir(candidate)
      await client.cd(candidate)
      console.log(`Рабочая папка на сервере: ${await client.pwd()}`)
      return candidate
    } catch {
      // try next candidate
    }
  }

  throw new Error('Не удалось открыть папку сайта. Проверьте FTP_REMOTE_DIR в deploy.env')
}

function listFilesRecursive(dir, base = dir) {
  const entries = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = path.relative(base, full).replace(/\\/g, '/')
    const stat = statSync(full)
    if (stat.isDirectory()) {
      entries.push(...listFilesRecursive(full, base))
    } else {
      entries.push({ local: full, remote: rel, size: stat.size })
    }
  }
  return entries
}

async function ensureRemoteDir(client, remoteDir) {
  if (!remoteDir || remoteDir === '.') return
  const parts = remoteDir.split('/').filter(Boolean)
  for (const part of parts) {
    try {
      await client.cd(part)
    } catch {
      await client.send(`MKD ${part}`)
      await client.cd(part)
    }
  }
}

async function uploadFiles(client, files) {
  const rootDir = await client.pwd()
  for (const file of files) {
    const remoteDir = path.posix.dirname(file.remote)
    const remoteName = path.posix.basename(file.remote)
    await client.cd(rootDir)
    await ensureRemoteDir(client, remoteDir)
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    process.stdout.write(`  ${file.remote} (${sizeMb} МБ)… `)
    await client.uploadFrom(file.local, remoteName)
    console.log('OK')
  }
  await client.cd(rootDir)
  return files.length
}

async function connectClient(env) {
  const client = new Client(0)
  client.ftp.verbose = false
  client.prepareTransfer = enterPassiveModeIPv4

  const secure = env.FTP_SECURE === 'true' || env.FTP_SECURE === '1'
  const port = env.FTP_PORT ? Number(env.FTP_PORT) : undefined

  console.log(`Подключение к ${env.FTP_HOST}${port ? `:${port}` : ''}${secure ? ' (FTPS)' : ''}…`)
  await client.access({
    host: env.FTP_HOST,
    user: env.FTP_USER,
    password: env.FTP_PASSWORD,
    port,
    secure,
  })

  return client
}

const env = loadDeployEnv()
const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR } = env

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !FTP_REMOTE_DIR) {
  console.error('В deploy.env нужны: FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR')
  process.exit(1)
}

if (!existsSync(distDir)) {
  console.error('Папка dist/ не найдена. Сначала: npm run build:hosting')
  process.exit(1)
}

const files = listFilesRecursive(distDir)
const totalMb = (files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1)
console.log(`Файлов к загрузке: ${files.length} (${totalMb} МБ)`)

let client
try {
  client = await connectClient(env)
  await resolveRemoteDir(client, FTP_REMOTE_DIR)
  console.log(`Загрузка dist/ → ${FTP_REMOTE_DIR}…`)
  await uploadFiles(client, files)
  try {
    await client.removeDir('about')
    console.log('Удалена устаревшая папка about/')
  } catch {
    // already removed
  }
  console.log('Готово. Откройте https://nagaevomaster.ru')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Ошибка FTP:', message)
  if (message.includes('Timeout')) {
    console.error('')
    console.error('Советы:')
    console.error('  • Проверьте интернет / VPN / файрвол')
    console.error('  • В deploy.env попробуйте FTP_SECURE=true (FTPS в ISPmanager)')
    console.error('  • Загрузите nagaevo-hosting.zip вручную: npm run package:hosting')
  }
  process.exit(1)
} finally {
  client?.close()
}
