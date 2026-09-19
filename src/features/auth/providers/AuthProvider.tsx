'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { ApiError } from '@/lib/api-client';

import type { AuthenticatedUser, UserRole } from '../types';

type AuthContextValue = {
  user: AuthenticatedUser | null;
  role: UserRole | null;

  isAuthenticated: boolean;
  isLoading: boolean;
  isUnauthenticated: boolean;

  error: Error | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: user, isLoading, error } = useCurrentUser();

  const isUnauthenticated =
    !isLoading && !user && error instanceof ApiError && error.status === 401;

  const value: AuthContextValue = {
    user: user ?? null,

    role: user?.role ?? null,

    isAuthenticated: Boolean(user),

    isLoading,

    isUnauthenticated,

    error: error ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
