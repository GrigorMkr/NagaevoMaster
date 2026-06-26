import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public', 'sounds', 'message.mp3');
const dstDir = path.join(root, 'android', 'app', 'src', 'main', 'res', 'raw');
const dst = path.join(dstDir, 'nagaevo_message.mp3');

if (!existsSync(src)) {
  console.warn('public/sounds/message.mp3 не найден — пропуск копирования в Android res/raw.');
  process.exit(0);
}

mkdirSync(dstDir, { recursive: true });
copyFileSync(src, dst);
console.log('Звук сообщения скопирован в android/res/raw/nagaevo_message.mp3');
