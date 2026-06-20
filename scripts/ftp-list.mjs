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

const client = new Client(60_000)
await client.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASSWORD, secure: false })

for (const dir of ['/', '/www', '/www/nagaevomaster.ru', '/www/nagaevomaster.ru/data']) {
  try {
    await client.cd(dir)
    const list = await client.list()
    console.log(`\n${dir} (${list.length} items):`)
    for (const item of list.slice(0, 20)) {
      console.log(`  ${item.isDirectory ? '[dir]' : '[file]'} ${item.name} (${item.size ?? '-'} bytes)`)
    }
  } catch (e) {
    console.log(`\n${dir}: недоступно`)
  }
}

client.close()
