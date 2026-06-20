import { env } from '../../config/env.js';
import { normalizePhone } from '../../utils/phone.js';

async function sendVerificationSms(phone: string, code: string): Promise<void> {
  const normalized = normalizePhone(phone);
  const message = `Код подтверждения Нагаево Мастер: ${code}`;

  if (!env.SMS_RU_API_ID) {
    console.log(`[sms:dev] ${normalized}: ${code}`);
    return;
  }

  const params = new URLSearchParams({
    api_id: env.SMS_RU_API_ID,
    to: normalized.replace(/\D/g, ''),
    msg: message,
    json: '1',
  });

  const response = await fetch(`https://sms.ru/sms/send?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Не удалось отправить SMS');
  }

  const body = await response.json() as {
    status?: string;
    status_code?: number;
    status_text?: string;
  };

  if (body.status === 'OK' && body.status_code === 100) {
    return;
  }

  const detail = body.status_text ?? `код ${body.status_code ?? 'unknown'}`;
  console.error('[sms.ru]', body);
  throw new Error(`SMS не отправлено: ${detail}`);
}

export {
  sendVerificationSms,
}
