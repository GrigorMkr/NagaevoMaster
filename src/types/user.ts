type UserRole = 'guest' | 'user' | 'master' | 'moderator' | 'admin';
import type { AccountLocation } from '@/types/location';

interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    role: UserRole;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    savedLocation?: AccountLocation;
    createdAt: string;
}

export type {
  UserRole,
  User,
}
