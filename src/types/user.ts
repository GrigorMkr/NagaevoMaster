export type UserRole = 'guest' | 'user' | 'master' | 'moderator' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatarUrl?: string
  role: UserRole
  createdAt: string
}
