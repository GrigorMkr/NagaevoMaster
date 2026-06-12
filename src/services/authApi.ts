import { USE_MOCK_FALLBACK } from '@/config/runtime';
import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { createMockToken, findMockAccount, getMockUserFromToken, isMockEmailRegistered, saveMockUserSession, } from '@/data/mock/authUsers';
import type { User } from '@/types/user';
import { api } from './api';
interface AuthResponse {
    token: string;
    user: User;
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
}
function clearAuthToken(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
function mockLogin(email: string, password: string): AuthResponse {
    const account = findMockAccount(email, password);
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
function mockRegister(data: {
    user: string;
    password: string;
    name: string;
    phone: string;
}): AuthResponse {
    const email = data.user.trim().toLowerCase();
    if (isMockEmailRegistered(email) || getMockUserFromToken(createMockToken(email))) {
        throw new Error('Пользователь с таким email уже существует');
    }
    const user: User = {
        id: `mock-${Date.now()}`,
        email,
        name: data.name,
        phone: data.phone,
        role: 'user',
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
    try {
        const response = await api.post<AuthResponse>('/auth/login', { user: email, password });
        return response.data;
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        return mockLogin(email, password);
    }
}
async function registerRequest(data: {
    user: string;
    password: string;
    name: string;
    phone: string;
}): Promise<AuthResponse> {
    try {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        return mockRegister(data);
    }
}
async function recoveryRequest(email: string): Promise<void> {
    await api.post('/auth/recovery', { email });
}
async function fetchCurrentUser(): Promise<User> {
    const token = getAuthToken();
    if (token) {
        const mockUser = getMockUserFromToken(token);
        if (mockUser)
            return mockUser;
    }
    const response = await api.get<User>('/auth/me');
    return response.data;
}

export {
  getAuthToken,
  saveAuthToken,
  clearAuthToken,
  loginRequest,
  registerRequest,
  recoveryRequest,
  fetchCurrentUser,
}

export type {
  AuthResponse,
}
