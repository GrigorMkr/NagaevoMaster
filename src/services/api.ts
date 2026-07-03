import axios from 'axios';
import { API_TIMEOUT_MS } from '@/constants';
import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { isJsonApiResponse } from '@/utils/apiGuards';
import { resolveAbsoluteApiBase } from '@/utils/apiBase';

let unauthorizedHandler: ((message?: string) => void) | null = null;

function setUnauthorizedHandler(handler: (message?: string) => void): void {
  unauthorizedHandler = handler;
}

function readBearerToken(): string | undefined {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? `Bearer ${token}` : undefined;
  } catch {
    return undefined;
  }
}

function isStaleUnauthorized(error: { config?: { headers?: { Authorization?: string } } }): boolean {
  const requestAuth = error.config?.headers?.Authorization;
  const currentAuth = readBearerToken();
  return Boolean(requestAuth && currentAuth && requestAuth !== currentAuth);
}

const api = axios.create({
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  config.baseURL = resolveAbsoluteApiBase();
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (isJsonApiResponse(response.data)) {
    return Promise.reject(new Error('API недоступен'));
  }
  return response;
}, (error) => {
  const status = error.response?.status;
  const requestUrl = String(error.config?.url ?? '');
  const isAuthRequest = requestUrl.includes('/auth/login')
    || requestUrl.includes('/auth/register')
    || requestUrl.includes('/auth/recovery')
    || requestUrl.includes('/auth/oauth/exchange')
    || requestUrl.includes('/auth/oauth/handoff');

  if (status === 401 && !isAuthRequest && !isStaleUnauthorized(error) && unauthorizedHandler) {
    const apiMessage = error.response?.data?.message;
    unauthorizedHandler(typeof apiMessage === 'string' ? apiMessage : undefined);
  }

  const message = error.response?.data?.message ?? error.message ?? 'Произошла ошибка при запросе';
  const friendly = message.includes('timeout of') && message.includes('exceeded')
    ? 'Превышено время ожидания сервера. Проверьте интернет и повторите.'
    : message;
  return Promise.reject(new Error(friendly));
});

export {
  api,
  setUnauthorizedHandler,
};
