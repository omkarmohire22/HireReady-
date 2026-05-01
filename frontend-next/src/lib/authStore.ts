import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  designation?: string;
  organisation?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,
      token: null,
      setAuth: (user, token) => set({ user, isAuthenticated: true, token }),
      logout: () => set({ user: null, isAuthenticated: false, token: null }),
    }),
    { name: 'hireready-auth' }
  )
);
