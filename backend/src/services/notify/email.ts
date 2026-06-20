import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_FROM) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }

  return transporter;
}

async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const subject = 'Код подтверждения — Нагаево Мастер';
  const text = `Ваш код подтверждения регистрации: ${code}\n\nКод действует 10 минут. Если вы не регистрировались на nagaevomaster.ru, проигнорируйте письмо.`;
  const html = `<p>Ваш код подтверждения регистрации:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Код действует 10 минут.</p>`;

  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email:dev] ${to}: ${code}`);
    return;
  }

  await mailer.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
  console.log(`[email] sent to ${to}`);
}

async function sendModeratorNewListingEmail(params: {
  listingTitle: string;
  authorName: string;
  listingId: string;
}): Promise<void> {
  const to = env.MODERATOR_NOTIFY_EMAIL;
  if (!to) {
    return;
  }

  const subject = `Новое объявление на модерации — ${params.listingTitle}`;
  const profileUrl = `${env.SITE_URL}/profile`;
  const text = [
    'На сайте Нагаево Мастер добавлено новое объявление.',
    '',
    `Заголовок: ${params.listingTitle}`,
    `Автор: ${params.authorName}`,
    `ID: ${params.listingId}`,
    '',
    `Откройте панель модерации: ${profileUrl}`,
  ].join('\n');
  const html = `
    <p>На сайте <strong>Нагаево Мастер</strong> добавлено новое объявление.</p>
    <ul>
      <li><strong>Заголовок:</strong> ${params.listingTitle}</li>
      <li><strong>Автор:</strong> ${params.authorName}</li>
    </ul>
    <p><a href="${profileUrl}">Открыть панель модерации</a></p>
  `;

  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email:moderator] ${to}: new listing "${params.listingTitle}"`);
    return;
  }

  await mailer.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
  console.log(`[email:moderator] new listing notice sent to ${to}`);
}

async function sendPasswordRecoveryEmail(to: string, code: string): Promise<void> {
  const subject = 'Восстановление пароля — Нагаево Мастер';
  const text = `Код для смены пароля: ${code}\n\nКод действует 10 минут. Если вы не запрашивали смену пароля, проигнорируйте письмо.`;
  const html = `<p>Код для смены пароля:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Код действует 10 минут.</p>`;

  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email:recovery] ${to}: ${code}`);
    return;
  }

  await mailer.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
  console.log(`[email:recovery] sent to ${to}`);
}

export {
  sendVerificationEmail,
  sendModeratorNewListingEmail,
  sendPasswordRecoveryEmail,
}
