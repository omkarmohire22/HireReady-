'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('theme');
      if (saved) setIsDark(saved === 'dark');
    } catch {}
  }, []);

  // Sync state from auth store user once loaded
  useEffect(() => {
    if (user?.theme) {
      setIsDark(user.theme === 'dark');
    }
  }, [user]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark, mounted]);

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      const themeStr = next ? 'dark' : 'light';
      
      // Update DOM and localStorage immediately
      const root = document.documentElement;
      root.setAttribute('data-theme', themeStr);
      try { localStorage.setItem('theme', themeStr); } catch {}
      
      // Send backend API call if authenticated
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        import('@/lib/api').then(({ api }) => {
          api.updateMe({ theme: themeStr }).catch(err => {
            console.error('Failed to sync theme to backend:', err);
          });
        });
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
