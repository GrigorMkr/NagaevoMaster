import axios from 'axios';
import { API_TIMEOUT_MS } from '@/constants';
import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { isJsonApiResponse } from '@/utils/apiGuards';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '/api';

let unauthorizedHandler: (() => void) | null = null;

function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
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

  if (status === 401 && !isAuthRequest && unauthorizedHandler) {
    unauthorizedHandler();
  }

  const message = error.response?.data?.message ?? error.message ?? 'Произошла ошибка при запросе';
  return Promise.reject(new Error(message));
});

export {
  api,
  setUnauthorizedHandler,
};
