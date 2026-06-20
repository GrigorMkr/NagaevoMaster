import { spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const outPath = path.join(root, 'nagaevo-hosting.zip')

if (!existsSync(distDir)) {
  console.error('Папка dist/ не найдена. Сначала: npm run build:hosting')
  process.exit(1)
}

if (existsSync(outPath)) {
  rmSync(outPath)
}

const zip = spawnSync(
  'powershell',
  [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path '${distDir.replace(/'/g, "''")}\\*' -DestinationPath '${outPath.replace(/'/g, "''")}' -Force`,
  ],
  { stdio: 'inherit' },
)

if (zip.status !== 0) {
  process.exit(zip.status ?? 1)
}

console.log(`Архив: ${outPath}`)
console.log('Распакуйте содержимое в папку сайта через ISPmanager → Менеджер файлов.')
