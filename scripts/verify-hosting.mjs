import { Client } from 'basic-ftp'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Writable } from 'node:stream'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const envPath = path.join(root, 'deploy.env')

function loadDeployEnv() {
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

function walkLocal(dir, base = '') {
  const files = []
  for (const entry of readdirSync(dir)) {
    const rel = base ? `${base}/${entry}` : entry
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...walkLocal(full, rel))
    } else {
      files.push({
        rel: rel.replace(/\\/g, '/'),
        size: statSync(full).size,
        hash: createHash('md5').update(readFileSync(full)).digest('hex'),
      })
    }
  }
  return files
}

async function downloadHash(client, remotePath, size) {
  const chunks = []
  const sink = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk)
      cb()
    },
  })
  await client.downloadTo(sink, remotePath)
  const buf = Buffer.concat(chunks)
  if (buf.length !== size) return null
  return createHash('md5').update(buf).digest('hex')
}

async function listRemote(client, dir = '.') {
  const items = await client.list(dir)
  const files = []
  for (const item of items) {
    const rel = dir === '.' ? item.name : `${dir}/${item.name}`
    if (item.isDirectory) {
      files.push(...await listRemote(client, rel))
    } else {
      files.push({ rel, size: item.size })
    }
  }
  return files
}

const env = loadDeployEnv()
if (!existsSync(distDir)) {
  console.error('Нет локальной папки dist/. Запустите: npm run build:hosting')
  process.exit(1)
}

const localFiles = walkLocal(distDir)
const localMap = new Map(localFiles.map((f) => [f.rel, f]))
const required = [
  'index.html',
  'early-redirect.js',
  'native-oauth-bridge.html',
  '.htaccess',
  '404.html',
  'favicon.svg',
  'favicon-32.png',
  'apple-touch-icon.png',
  'og-image.png',
  'site.webmanifest',
  'sw.js',
  'sounds/message.mp3',
]

const client = new Client(120_000)
try {
  await client.access({
    host: env.FTP_HOST,
    user: env.FTP_USER,
    password: env.FTP_PASSWORD,
    secure: false,
  })
  await client.cd(env.FTP_REMOTE_DIR)

  const remoteFiles = await listRemote(client)
  const remoteMap = new Map(remoteFiles.map((f) => [f.rel, f]))

  console.log(`Локально: ${localFiles.length} файлов`)
  console.log(`На сервере: ${remoteFiles.length} файлов\n`)

  let missing = 0
  let sizeMismatch = 0
  let hashMismatch = 0

  for (const [rel, local] of localMap) {
    const remote = remoteMap.get(rel)
    if (!remote) {
      console.log(`❌ Нет на сервере: ${rel}`)
      missing++
      continue
    }
    if (remote.size !== local.size) {
      console.log(`⚠️  Размер не совпадает: ${rel} (локально ${local.size}, сервер ${remote.size})`)
      sizeMismatch++
    }
  }

  const extra = remoteFiles.filter((f) => !localMap.has(f.rel))
  if (extra.length) {
    console.log(`\nЛишние на сервере (${extra.length}):`)
    for (const f of extra.slice(0, 15)) console.log(`  + ${f.rel}`)
    if (extra.length > 15) console.log(`  … и ещё ${extra.length - 15}`)
  }

  console.log('\nПроверка ключевых файлов:')
  for (const name of required) {
    const local = localMap.get(name)
    const remote = remoteMap.get(name)
    if (!local || !remote) {
      console.log(`❌ ${name}`)
      continue
    }
    const remoteHash = await downloadHash(client, name, local.size)
    const ok = remoteHash === local.hash
    console.log(`${ok ? '✅' : '❌'} ${name} (${local.size} bytes)`)
    if (!ok) hashMismatch++
  }

  const assetsDir = remoteFiles.filter((f) => f.rel.startsWith('assets/'))
  const listingsDir = remoteFiles.filter((f) => f.rel.startsWith('listings/'))
  console.log(`\nПапка assets/: ${assetsDir.length} файлов на сервере`)
  console.log(`Папка listings/: ${listingsDir.length} файлов на сервере`)

  const indexRemote = remoteMap.get('index.html')
  if (indexRemote) {
    const hash = await downloadHash(client, 'index.html', indexRemote.size)
    const local = localMap.get('index.html')
    const contentCheck = hash === local?.hash
    console.log(`\nindex.html содержимое: ${contentCheck ? 'совпадает с локальной сборкой' : 'НЕ совпадает'}`)
  }

  if (missing === 0 && sizeMismatch === 0 && hashMismatch === 0) {
    console.log('\n✅ Все файлы загружены корректно.')
  } else {
    console.log(`\n⚠️  Проблемы: нет=${missing}, размер=${sizeMismatch}, хеш=${hashMismatch}`)
    console.log('Перезалейте: npm run build:hosting && npm run deploy:hosting')
  }
} catch (error) {
  console.error('Ошибка:', error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  client.close()
}
