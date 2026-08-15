import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../types';
import { authService } from '../../services/authService';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string; remember?: boolean }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    avatar_url?: string | null;
    bio?: string | null;
    location?: string | null;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (payload: { email: string; password: string; remember?: boolean }) => {
    const loggedInUser = await authService.login(payload);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
    }) => {
      const registeredUser = await authService.register(payload);
      setUser(registeredUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (payload: {
      name?: string;
      avatar_url?: string | null;
      bio?: string | null;
      location?: string | null;
    }) => {
      const updatedUser = await authService.updateProfile(payload);
      setUser(updatedUser);
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [user, isLoading, login, register, logout, refreshUser, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
