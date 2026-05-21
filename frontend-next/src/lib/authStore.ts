import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  designation?: string;
  organisation?: string;
  theme?: string;
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
      setAuth: (user, token) => {
        // Sync to localStorage.token so api.ts can read it directly
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          document.cookie = `auth-token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({ user, isAuthenticated: true, token });
      },
      logout: () => {
        // Clear the direct token key on logout too
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          document.cookie = 'auth-token=; path=/; max-age=0';
        }
        set({ user: null, isAuthenticated: false, token: null });
      },
    }),
    { name: 'hireready-auth' }
  )
);
