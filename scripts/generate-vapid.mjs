/**
 * Генерация VAPID-ключей для Web Push.
 *   npm run vapid:generate
 */
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const webpush = require(resolve(dirname(fileURLToPath(import.meta.url)), '../backend/node_modules/web-push'));

const keys = webpush.generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:noreply@nagaevomaster.ru');
