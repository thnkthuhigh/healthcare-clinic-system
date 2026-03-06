import { createContext } from 'react';

import type { AuthUser, LoginCredentials } from './auth.types';

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<import('./auth.types').AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
