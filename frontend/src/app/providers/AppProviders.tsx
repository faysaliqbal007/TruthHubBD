import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider } from '../../features/auth/AuthContext';
import { ComingSoonProvider } from '../../features/shared/ComingSoonContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ComingSoonProvider>{children}</ComingSoonProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
