/**
 * Тест SMTP/SMS на VPS (читает backend/.env на сервере).
 *
 *   npm run vps:notify:test
 *   TEST_EMAIL=you@mail.ru TEST_PHONE=+79001234567 npm run vps:notify:test
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'ssh2';

const keyPath = join(homedir(), '.ssh', 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const testEmail = process.env.TEST_EMAIL ?? '';
const testPhone = process.env.TEST_PHONE ?? '';

const remoteScript = `#!/bin/bash
set -euo pipefail
cd /var/www/nagaevomaster/backend
export $(grep -E '^(SMTP_|SMS_)' .env | xargs)
CODE=123456

if [[ -n "${testEmail}" && -n "$SMTP_HOST" ]]; then
  node --input-type=module -e "
    import nodemailer from 'nodemailer';
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await t.sendMail({
      from: process.env.SMTP_FROM,
      to: '${testEmail}',
      subject: 'Тест Нагаево Мастер',
      text: 'Код теста: ${CODE}',
    });
    console.log('EMAIL OK → ${testEmail}');
  "
else
  echo "SKIP email (set TEST_EMAIL and SMTP_* in .env)"
fi

if [[ -n "${testPhone}" && -n "$SMS_RU_API_ID" ]]; then
  node --input-type=module -e "
    const p = new URLSearchParams({
      api_id: process.env.SMS_RU_API_ID,
      to: '${testPhone}'.replace(/\\D/g, ''),
      msg: 'Тест Нагаево Мастер: ${CODE}',
      json: '1',
    });
    const r = await fetch('https://sms.ru/sms/send?' + p);
    const b = await r.json();
    console.log('SMS response:', JSON.stringify(b));
    if (b.status !== 'OK') process.exit(1);
    console.log('SMS OK → ${testPhone}');
  "
else
  echo "SKIP sms (set TEST_PHONE and SMS_RU_API_ID in .env)"
fi
`;

function run(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => process.exit(code ?? 0));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const ws = sftp.createWriteStream('/tmp/test-notify.sh', { mode: 0o755 });
      ws.on('close', resolve);
      ws.on('error', reject);
      ws.end(remoteScript);
    });
  });
  await run(conn, 'bash /tmp/test-notify.sh');
}).connect({
  host,
  port: 22,
  username: 'root',
  privateKey: readFileSync(keyPath),
});
