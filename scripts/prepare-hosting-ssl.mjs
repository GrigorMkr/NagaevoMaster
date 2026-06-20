/**
 * Собирает файлы DomainSSL для загрузки в ISPmanager REG.RU.
 * Пути по умолчанию — Downloads; переопределите через env.
 *
 *   node scripts/prepare-hosting-ssl.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'deploy/ssl-local');
const downloads = resolve(homedir(), 'Downloads');

const domainCertPath =
  process.env.SSL_DOMAIN_CERT ??
  resolve(downloads, 'certificate.crt');
const keyPath =
  process.env.SSL_PRIVATE_KEY ?? resolve(downloads, 'certificate (1).key');
const chainPath =
  process.env.SSL_CHAIN_CERT ?? resolve(downloads, 'certificate_ca.crt');

function readRequired(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Не найден ${label}: ${path}`);
  }
  return readFileSync(path, 'utf8').trim() + '\n';
}

const domainCert = existsSync(domainCertPath)
  ? readRequired(domainCertPath, 'Сертификат домена')
  : readRequired(resolve(downloads, 'certificate (1).crt'), 'Сертификат домена');
const privateKey = readRequired(keyPath, 'Приватный ключ');
const chain = readRequired(chainPath, 'Цепочка CA');

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'nagaevomaster.ru.crt'), domainCert);
writeFileSync(resolve(outDir, 'nagaevomaster.ru.key'), privateKey);
writeFileSync(resolve(outDir, 'nagaevomaster.ru-chain.crt'), chain);
writeFileSync(resolve(outDir, 'nagaevomaster.ru-fullchain.crt'), domainCert + chain);
writeFileSync(
  resolve(outDir, 'README.txt'),
  [
    'Файлы для ISPmanager → SSL-сертификаты',
    '',
    'Сертификат:     nagaevomaster.ru.crt',
    'Приватный ключ: nagaevomaster.ru.key',
    'Цепочка CA:     nagaevomaster.ru-chain.crt',
    '',
    'Не коммитить в git. См. deploy/HOSTING-SSL.md',
  ].join('\n'),
);

console.log(`Готово: ${outDir}`);
console.log('Дальше: ISPmanager → SSL → загрузить эти три файла → привязать к nagaevomaster.ru');
