/**

 * Выключить интерфейс WireGuard на роутере (политики не трогаем).

 *   npm run keenetic:restore-internet

 */

import { readFileSync, existsSync } from 'node:fs';

import { join, resolve, dirname } from 'node:path';

import { fileURLToPath } from 'node:url';

import { keeneticEnv } from './lib.mjs';

import { keeneticRci } from './auth.mjs';



const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const envFile = join(root, 'deploy', 'keenetic.env');



if (existsSync(envFile)) {

  for (const line of readFileSync(envFile, 'utf8').split('\n')) {

    const t = line.trim();

    if (!t || t.startsWith('#')) continue;

    const i = t.indexOf('=');

    if (i < 0) continue;

    const key = t.slice(0, i).trim();

    if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();

  }

}



const env = keeneticEnv();

const { wgName } = env;



if (!env.password) {

  console.error('Укажите KEENETIC_PASSWORD или deploy/keenetic.env');

  process.exit(1);

}



console.log(`Выключаем ${wgName} (политики не меняем)\n`);



try {

  await keeneticRci(`interface/${wgName}`, [{ up: false }]);

  console.log(`✓ ${wgName} выключен`);

} catch {

  console.log(`! ${wgName} — не удалось выключить через RCI`);

}



await keeneticRci('system/configuration', [{ save: true }]);

console.log('✓ сохранено\nМаршрутизацию настройте вручную в веб-интерфейсе.');

