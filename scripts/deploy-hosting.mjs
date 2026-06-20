import { Client } from 'basic-ftp'
import { existsSync, readFileSync } from 'node:fs'
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

  throw new Error(`Не удалось открыть папку сайта. Проверьте FTP_REMOTE_DIR в deploy.env`)
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

const client = new Client(120_000)
client.ftp.verbose = false

try {
  console.log(`Подключение к ${FTP_HOST}…`)
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
    secure: false,
  })

  const remoteDir = await resolveRemoteDir(client, FTP_REMOTE_DIR)
  console.log(`Загрузка dist/ → ${remoteDir}…`)
  await client.uploadFromDir(distDir)
  console.log('Готово. Откройте https://nagaevomaster.ru')
} catch (error) {
  console.error('Ошибка FTP:', error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  client.close()
}
