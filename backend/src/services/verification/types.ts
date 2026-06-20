type VerificationChannel = 'email' | 'sms';

interface RegistrationPayload {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}

export type {
  VerificationChannel,
  RegistrationPayload,
}
