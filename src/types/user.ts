type UserRole = 'guest' | 'user' | 'master' | 'moderator' | 'admin';
interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    role: UserRole;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    createdAt: string;
}

export type {
  UserRole,
  User,
}
