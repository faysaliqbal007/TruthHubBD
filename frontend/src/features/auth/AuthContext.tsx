"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../../types";
import { authService } from "../../services/authService";

type AuthState = { user: User | null; checking: boolean; setUser: (user: User | null) => void; logout: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => { 
    authService.currentUser()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false)); 
  }, []);

  const value = useMemo(() => ({ 
    user, 
    checking, 
    setUser, 
    logout: async () => { 
      try { 
        await authService.logout(); 
      } catch {
        // Silently swallow errors (e.g. already unauthenticated on server)
      } finally { 
        setUser(null); 
      } 
    } 
  }), [user, checking]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { 
  const value = useContext(AuthContext); 
  if (!value) throw new Error("useAuth must be used inside AuthProvider"); 
  return value; 
}
