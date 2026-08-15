import type { User } from '../../types';
import { apiRequest } from './client';

interface AuthResponse {
  user: User;
}

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await apiRequest<AuthResponse>('/api/user');
      return data.user;
    } catch {
      return null;
    }
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<User> {
    const data = await apiRequest<AuthResponse>('/api/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.user;
  },

  async login(payload: {
    email: string;
    password: string;
    remember?: boolean;
  }): Promise<User> {
    const data = await apiRequest<AuthResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.user;
  },

  async logout(): Promise<void> {
    await apiRequest('/api/logout', { method: 'POST' });
  },

  async updateProfile(payload: {
    name?: string;
    avatar_url?: string | null;
    bio?: string | null;
    location?: string | null;
  }): Promise<User> {
    const data = await apiRequest<AuthResponse>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return data.user;
  },

  getGoogleAuthUrl(): string {
    const base = import.meta.env.VITE_API_URL ?? '';
    return `${base}/api/auth/google/redirect`;
  },
};
