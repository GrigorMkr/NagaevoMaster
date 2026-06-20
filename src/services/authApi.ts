import { USE_MOCK_FALLBACK } from '@/config/runtime';
import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { createMockToken, findMockAccount, getMockUserFromToken, isMockEmailRegistered, saveMockUserSession, } from '@/data/mock/authUsers';
import type { User } from '@/types/user';
import { isRecord } from '@/utils/apiGuards';
import { api } from './api';

type VerificationChannel = 'email' | 'sms';

interface AuthResponse {
    token: string;
    user: User;
}

interface RegisterPayload {
    user: string;
    password: string;
    name: string;
    phone: string;
}

interface SendCodeResponse {
    message: string;
    channel: VerificationChannel;
    target: string;
}

interface RecoverySendResponse {
    message: string;
    target?: string;
}

const MOCK_VERIFICATION_CODE = '123456';

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function shouldUseAuthMock(): boolean {
    return USE_MOCK_FALLBACK;
}

function getAuthToken(): string | null {
    try {
        return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    }
    catch {
        return null;
    }
}

function saveAuthToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    if (!token.startsWith('mock:')) {
        try {
            localStorage.removeItem('nagaevomaster-mock-user');
        }
        catch {
            // ignore
        }
    }
}

function clearAuthToken(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function mockLogin(email: string, password: string): AuthResponse {
    const account = findMockAccount(normalizeEmail(email), password);
    if (!account) {
        throw new Error('Неверный email или пароль');
    }
    const response = {
        token: createMockToken(account.email),
        user: account.user,
    };
    saveMockUserSession(account.email, account.user);
    return response;
}

function mockRegister(data: RegisterPayload): AuthResponse {
    const email = normalizeEmail(data.user);
    if (isMockEmailRegistered(email) || getMockUserFromToken(createMockToken(email))) {
        throw new Error('Пользователь с таким email уже существует');
    }
    const user: User = {
        id: `mock-${Date.now()}`,
        email,
        name: data.name,
        phone: data.phone,
        role: 'user',
        emailVerified: true,
        phoneVerified: true,
        createdAt: new Date().toISOString(),
    };
    const response = {
        token: createMockToken(email),
        user,
    };
    saveMockUserSession(email, user);
    return response;
}

async function loginRequest(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(email);
    try {
        const response = await api.post<AuthResponse>('/auth/login', {
            user: normalizedEmail,
            password,
        });
        return response.data;
    }
    catch (error) {
        if (!shouldUseAuthMock()) {
            throw error;
        }
        return mockLogin(normalizedEmail, password);
    }
}

async function sendRegistrationCode(
    channel: VerificationChannel,
    data: RegisterPayload,
): Promise<SendCodeResponse> {
    const payload = {
        ...data,
        user: normalizeEmail(data.user),
    };
    try {
        const response = await api.post<SendCodeResponse>('/auth/register/send-code', {
            channel,
            ...payload,
        });
        return response.data;
    }
    catch (error) {
        if (!shouldUseAuthMock()) {
            throw error;
        }
        const target = channel === 'email' ? payload.user : data.phone;
        sessionStorage.setItem(`mock-register:${channel}:${target}`, JSON.stringify(payload));
        return {
            message: channel === 'email' ? 'Код отправлен на email (демо: 123456)' : 'Код отправлен в SMS (демо: 123456)',
            channel,
            target,
        };
    }
}

async function verifyRegistrationCode(
    channel: VerificationChannel,
    target: string,
    code: string,
): Promise<AuthResponse> {
    const normalizedTarget = channel === 'email' ? normalizeEmail(target) : target;
    try {
        const response = await api.post<AuthResponse>('/auth/register/verify', {
            channel,
            target: normalizedTarget,
            code,
        });
        return response.data;
    }
    catch (error) {
        if (!shouldUseAuthMock()) {
            throw error;
        }
        if (code !== MOCK_VERIFICATION_CODE) {
            throw new Error('Неверный код подтверждения');
        }
        const stored = sessionStorage.getItem(`mock-register:${channel}:${normalizedTarget}`);
        if (!stored) {
            throw new Error('Сначала запросите код подтверждения');
        }
        const data = JSON.parse(stored) as RegisterPayload;
        sessionStorage.removeItem(`mock-register:${channel}:${normalizedTarget}`);
        return mockRegister(data);
    }
}

async function registerRequest(data: RegisterPayload): Promise<AuthResponse> {
    return verifyRegistrationCode('email', normalizeEmail(data.user), MOCK_VERIFICATION_CODE);
}

async function sendRecoveryCode(email: string): Promise<RecoverySendResponse> {
    const normalizedEmail = normalizeEmail(email);
    try {
        const response = await api.post<RecoverySendResponse>('/auth/recovery/send-code', {
            email: normalizedEmail,
        });
        return response.data;
    }
    catch (error) {
        if (!shouldUseAuthMock()) {
            throw error;
        }
        return {
            message: 'Если email зарегистрирован, код отправлен (демо: 123456)',
            target: normalizedEmail,
        };
    }
}

async function resetPasswordRequest(
    email: string,
    code: string,
    password: string,
): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(email);
    try {
        const response = await api.post<AuthResponse & { message: string }>('/auth/recovery/reset', {
            email: normalizedEmail,
            code,
            password,
        });
        return {
            token: response.data.token,
            user: response.data.user,
        };
    }
    catch (error) {
        if (!shouldUseAuthMock()) {
            throw error;
        }
        if (code !== MOCK_VERIFICATION_CODE) {
            throw new Error('Неверный код');
        }
        throw new Error('Восстановление пароля доступно только через API');
    }
}

async function recoveryRequest(email: string): Promise<void> {
    await sendRecoveryCode(email);
}

async function fetchCurrentUser(): Promise<User> {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Требуется авторизация');
    }
    if (token.startsWith('mock:')) {
        const mockUser = getMockUserFromToken(token);
        if (mockUser) {
            return mockUser;
        }
    }
    const response = await api.get<User>('/auth/me');
    if (!isRecord(response.data) || typeof response.data.id !== 'string') {
        throw new Error('Invalid user response');
    }
    return response.data;
}

export {
  getAuthToken,
  saveAuthToken,
  clearAuthToken,
  loginRequest,
  sendRegistrationCode,
  verifyRegistrationCode,
  registerRequest,
  sendRecoveryCode,
  resetPasswordRequest,
  recoveryRequest,
  fetchCurrentUser,
  normalizeEmail,
  MOCK_VERIFICATION_CODE,
}

export type {
  AuthResponse,
  RegisterPayload,
  SendCodeResponse,
  RecoverySendResponse,
  VerificationChannel,
}
