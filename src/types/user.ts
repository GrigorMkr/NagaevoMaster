type UserRole = 'guest' | 'user' | 'master' | 'moderator' | 'admin';
import type { AccountLocation } from '@/types/location';
import type { HomeLocation } from '@/types/location';

interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    role: UserRole;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    birthYear?: number;
    savedLocation?: AccountLocation;
    homeLocation?: HomeLocation;
    createdAt: string;
}

export type {
  UserRole,
  User,
}
