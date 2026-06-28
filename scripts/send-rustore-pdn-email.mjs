/**
 * Письмо в RuStore с подтверждением уведомления РКН об обработке ПДн.
 *
 *   npm run send:rustore-pdn
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'backend/package.json'));
const nodemailer = require('nodemailer');

const NOTIFY_PATH = resolve(root, 'deploy/notify.env');
const PDF_PATH = resolve(root, 'deploy/roskomnadzor-pdn.local.pdf');
const TO = 'support@rustore.ru';

function loadEnv(file) {
  const vars = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    vars[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return vars;
}

const smtp = loadEnv(NOTIFY_PATH);
if (!smtp.SMTP_HOST || !smtp.SMTP_USER || !smtp.SMTP_PASS) {
  console.error('Заполните SMTP_* в deploy/notify.env');
  process.exit(1);
}

if (!existsSync(PDF_PATH)) {
  console.error(`Нет файла: ${PDF_PATH}`);
  process.exit(1);
}

const subject = 'Подтверждение регистрации оператора ПДн — ru.nagaevomaster.app';

const text = `Здравствуйте!

Прошу учесть при модерации мобильного приложения «Нагаево Мастер».

Package name: ru.nagaevomaster.app
Каталог: https://www.rustore.ru/catalog/app/ru.nagaevomaster.app
Сайт: https://nagaevomaster.ru

Уведомление об обработке персональных данных подано в Роскомнадзор:
- номер уведомления: 100334362;
- ключ: 21298367;
- оператор: Мкртчян Григор Гегамович, ИНН 025102898988;
- регион: Республика Башкортостан.

Копию уведомления прилагаю. Выписку из реестра операторов персональных данных направлю дополнительно после её получения из Роскомнадзора.

Контакты для связи:
- телефон: +7 987 148-40-32
- email: Grom666@gmail.com

С уважением,
Мкртчян Григор Гегамович
`;

const transport = nodemailer.createTransport({
  host: smtp.SMTP_HOST,
  port: Number(smtp.SMTP_PORT || 587),
  secure: smtp.SMTP_SECURE === 'true',
  auth: { user: smtp.SMTP_USER, pass: smtp.SMTP_PASS },
});

const info = await transport.sendMail({
  from: smtp.SMTP_FROM || smtp.SMTP_USER,
  to: TO,
  replyTo: 'Grom666@gmail.com',
  subject,
  text,
  attachments: [
    {
      filename: 'roskomnadzor-pdn-notification-100334362.pdf',
      path: PDF_PATH,
      contentType: 'application/pdf',
    },
  ],
});

console.log(`OK: письмо отправлено → ${TO}`);
console.log(`Message-ID: ${info.messageId}`);
