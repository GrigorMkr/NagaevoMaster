import { spawn } from 'node:child_process'

const url = 'https://render.com/deploy?repo=https://github.com/GrigorMkr/NagaevoMaster'

console.log('Откройте в браузере и нажмите Approve:')
console.log(url)
console.log('\nПосле статуса Live на Render запустите: npm run deploy:full')

const platform = process.platform
if (platform === 'win32') {
  spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref()
} else if (platform === 'darwin') {
  spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
} else {
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
}
