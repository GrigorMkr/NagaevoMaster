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
}

export {
  sendVerificationEmail,
}
