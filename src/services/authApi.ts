import type { User } from '@/types/user'
import { api } from './api'

export interface AuthResponse {
  token: string
  user: User
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', { user: email, password })
  return response.data
}

export async function registerRequest(data: {
  user: string
  password: string
  name: string
  phone: string
}): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', data)
  return response.data
}

export async function recoveryRequest(email: string): Promise<void> {
  await api.post('/auth/recovery', { email })
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await api.get<User>('/auth/me')
  return response.data
}

export function saveAuthToken(token: string): void {
  localStorage.setItem('token', token)
}

export function clearAuthToken(): void {
  localStorage.removeItem('token')
}
