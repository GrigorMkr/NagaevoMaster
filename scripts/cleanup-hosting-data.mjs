import { Client } from 'basic-ftp'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(path.join(root, 'deploy.env'), 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq > -1) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
}

async function removeRecursive(client, remotePath) {
  const items = await client.list(remotePath)
  for (const item of items) {
    const full = remotePath === '.' ? item.name : `${remotePath}/${item.name}`
    if (item.isDirectory) {
      await removeRecursive(client, full)
      await client.removeDir(full)
      console.log(`Удалена папка: ${full}`)
    } else {
      await client.remove(full)
      console.log(`Удалён файл: ${full}`)
    }
  }
}

const client = new Client(120_000)
try {
  await client.access({
    host: env.FTP_HOST,
    user: env.FTP_USER,
    password: env.FTP_PASSWORD,
    secure: false,
  })
  await client.cd('/www/nagaevomaster.ru/data')
  console.log('Очистка /www/nagaevomaster.ru/data …')
  await removeRecursive(client, '.')
  await client.cdup()
  await client.removeDir('data')
  console.log('Готово: папка data удалена.')
} catch (error) {
  console.error('Ошибка:', error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  client.close()
}
