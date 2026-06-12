import type { User } from '@/types/user'

const MOCK_USER_STORAGE_KEY = 'nagaevomaster-mock-user'

interface MockAuthAccount {
  email: string
  password: string
  user: User
}

export const MOCK_AUTH_ACCOUNTS: MockAuthAccount[] = [
  {
    email: 'demo@nagaevomaster.ru',
    password: 'master123',
    user: {
      id: 'mock-demo',
      email: 'demo@nagaevomaster.ru',
      name: 'Демо Пользователь',
      phone: '+7 (900) 000-00-00',
      role: 'user',
      createdAt: '2026-01-01T00:00:00Z',
    },
  },
  {
    email: 'admin@nagaevomaster.ru',
    password: 'admin123',
    user: {
      id: 'mock-admin',
      email: 'admin@nagaevomaster.ru',
      name: 'Администратор',
      phone: '+7 (347) 000-00-00',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00Z',
    },
  },
]

export function findMockAccount(email: string, password: string): MockAuthAccount | undefined {
  const normalized = email.trim().toLowerCase()
  return MOCK_AUTH_ACCOUNTS.find(
    (account) => account.email === normalized && account.password === password,
  )
}

export function createMockToken(email: string): string {
  return `mock:${email.trim().toLowerCase()}`
}

export function saveMockUserSession(email: string, user: User): void {
  try {
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify({ email, user }))
  } catch {
    // ignore
  }
}

export function getMockUserFromToken(token: string): User | null {
  if (!token.startsWith('mock:')) return null
  const email = token.slice(5)

  try {
    const stored = JSON.parse(localStorage.getItem(MOCK_USER_STORAGE_KEY) ?? 'null') as {
      email?: string
      user?: User
    } | null
    if (stored?.email === email && stored.user) return stored.user
  } catch {
    // ignore
  }

  return MOCK_AUTH_ACCOUNTS.find((account) => account.email === email)?.user ?? null
}

export function isMockEmailRegistered(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return MOCK_AUTH_ACCOUNTS.some((account) => account.email === normalized)
}
