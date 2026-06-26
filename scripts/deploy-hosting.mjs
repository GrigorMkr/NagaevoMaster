import { Client, enterPassiveModeIPv4 } from 'basic-ftp'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const envPath = path.join(root, 'deploy.env')

const CLIENT_TIMEOUT_MS = 120_000
const UPLOAD_RETRIES = 3
const RETRY_DELAY_MS = 3_000
const NOOP_INTERVAL_MS = 45_000

const PRIORITY_FILES = [
  '.htaccess',
  'index.html',
  '404.html',
  'app-version.json',
  'site-version.json',
  'early-redirect.js',
  'native-oauth-bridge.html',
]

/** Всегда перезаливать: размер может совпасть, а ссылки на assets — нет */
const ALWAYS_UPLOAD = new Set(['index.html', '404.html', '.htaccess', 'site-version.json'])

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

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

function enableSocketKeepAlive(client) {
  const socket = client.ftp.socket
  if (socket && typeof socket.setKeepAlive === 'function') {
    socket.setKeepAlive(true, 30_000)
  }
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
      return await client.pwd()
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

function sortUploadOrder(files) {
  return [...files].sort((a, b) => {
    const ap = PRIORITY_FILES.indexOf(a.remote)
    const bp = PRIORITY_FILES.indexOf(b.remote)
    if (ap !== -1 || bp !== -1) {
      return (ap === -1 ? 999 : ap) - (bp === -1 ? 999 : bp)
    }
    const aMain = /\/index-[^/]+\.js$/.test(a.remote)
    const bMain = /\/index-[^/]+\.js$/.test(b.remote)
    if (aMain !== bMain) return aMain ? -1 : 1
    if (a.size !== b.size) return b.size - a.size
    return a.remote.localeCompare(b.remote)
  })
}

async function listRemoteFiles(client, dir = '.') {
  const files = []
  const items = await client.list(dir)
  for (const item of items) {
    const rel = dir === '.' ? item.name : `${dir}/${item.name}`
    if (item.isDirectory) {
      files.push(...await listRemoteFiles(client, rel))
    } else {
      files.push({ rel: rel.replace(/^\.\//, ''), size: item.size })
    }
  }
  return files
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

async function uploadOneFile(client, localPath, remoteName) {
  let noopTimer
  try {
    noopTimer = setInterval(() => {
      if (client.closed) return
      void client.send('NOOP').catch(() => undefined)
    }, NOOP_INTERVAL_MS)
    await client.uploadFrom(localPath, remoteName)
  } finally {
    clearInterval(noopTimer)
  }
}

async function connectClient(env) {
  const client = new Client(CLIENT_TIMEOUT_MS, {
    // REG.RU: data-соединение на тот же хост, что и control — меньше зависаний PASV
    allowSeparateTransferHost: false,
  })
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
  enableSocketKeepAlive(client)

  return client
}

async function openUploadSession(env, remoteDir) {
  const client = await connectClient(env)
  await resolveRemoteDir(client, remoteDir)
  const rootDir = await client.pwd()
  return { client, rootDir }
}

async function uploadFiles(env, remoteDir, files, remoteSizeByPath) {
  let session = await openUploadSession(env, remoteDir)
  let uploaded = 0
  let skipped = 0

  try {
    for (const file of files) {
      if (!ALWAYS_UPLOAD.has(file.remote) && remoteSizeByPath.get(file.remote) === file.size) {
        skipped += 1
        process.stdout.write(`  ${file.remote} … пропуск (уже на сервере)\n`)
        continue
      }

      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      let lastError

      for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt += 1) {
        try {
          if (session.client.closed) {
            session = await openUploadSession(env, remoteDir)
          }

          const remoteDirPath = path.posix.dirname(file.remote)
          const remoteName = path.posix.basename(file.remote)
          await session.client.cd(session.rootDir)
          await ensureRemoteDir(session.client, remoteDirPath)

          const retryLabel = attempt > 1 ? ` (повтор ${attempt}/${UPLOAD_RETRIES})` : ''
          process.stdout.write(`  ${file.remote} (${sizeMb} МБ)${retryLabel}… `)
          await uploadOneFile(session.client, file.local, remoteName)
          console.log('OK')
          uploaded += 1
          remoteSizeByPath.set(file.remote, file.size)
          lastError = undefined
          break
        } catch (error) {
          lastError = error
          const message = error instanceof Error ? error.message : String(error)
          console.log(`ошибка: ${message}`)

          try {
            session.client.close()
          } catch {
            // already closed
          }

          if (attempt < UPLOAD_RETRIES) {
            await sleep(RETRY_DELAY_MS)
            session = await openUploadSession(env, remoteDir)
          }
        }
      }

      if (lastError) {
        throw lastError
      }
    }
  } finally {
    try {
      session.client.close()
    } catch {
      // ignore
    }
  }

  return { uploaded, skipped }
}

function printFtpHints(message) {
  console.error('')
  console.error('Советы:')
  if (message.includes('Timeout') || message.includes('421') || message.includes('ECONNRESET')) {
    console.error('  • Повторите: npm run deploy:hosting — уже загруженные файлы будут пропущены')
    console.error('  • Попробуйте FTPS: в deploy.env добавьте FTP_SECURE=true')
    console.error('  • Или залейте архив вручную: npm run package:hosting → ISPmanager')
  }
  console.error('  • Проверьте интернет / VPN / файрвол')
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

const files = sortUploadOrder(listFilesRecursive(distDir))
const totalMb = (files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1)
console.log(`Файлов к загрузке: ${files.length} (${totalMb} МБ)`)

let client
try {
  client = await connectClient(env)
  await resolveRemoteDir(client, FTP_REMOTE_DIR)
  console.log('Сканирование файлов на сервере…')
  const remoteFiles = await listRemoteFiles(client)
  const remoteSizeByPath = new Map(remoteFiles.map((file) => [file.rel, file.size]))
  client.close()
  client = undefined

  console.log(`Загрузка dist/ → ${FTP_REMOTE_DIR}…`)
  const { uploaded, skipped } = await uploadFiles(env, FTP_REMOTE_DIR, files, remoteSizeByPath)

  const cleanupClient = await connectClient(env)
  await resolveRemoteDir(cleanupClient, FTP_REMOTE_DIR)
  try {
    await cleanupClient.removeDir('about')
    console.log('Удалена устаревшая папка about/')
  } catch {
    // already removed
  }
  cleanupClient.close()

  console.log(`Готово: загружено ${uploaded}, пропущено ${skipped}. Откройте https://nagaevomaster.ru`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Ошибка FTP:', message)
  printFtpHints(message)
  process.exit(1)
} finally {
  client?.close()
}
