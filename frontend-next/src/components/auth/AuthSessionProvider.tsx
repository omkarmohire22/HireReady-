'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';

/**
 * Bridges the NextAuth session (Google OAuth) into Zustand's authStore.
 * This ensures `token` in Zustand + localStorage are always set after Google login,
 * and the user object reflects the real backend DB user (not just the Google profile).
 */
function TokenBridge() {
  const { data: session, status } = useSession();
  const setAuth = useAuthStore(s => s.setAuth);
  const logout = useAuthStore(s => s.logout);
  const currentToken = useAuthStore(s => s.token);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    // If next-auth session is still loading, wait
    if (status === 'loading') return;

    const backendToken = (session as any)?.backendToken;

    // SCENARIO 1: No active NextAuth session (User logged out or session expired)
    if (!backendToken) {
      // If Zustand/localStorage still holds a stale token, purge it immediately
      if (isAuthenticated && currentToken) {
        logout();
      }
      return;
    }

    // SCENARIO 2: Active NextAuth session, token matches current Zustand token -> do nothing
    if (backendToken === currentToken) return;

    // SCENARIO 3: Active NextAuth session, but token is different (User switched accounts or freshly signed in)
    // First set auth with Google profile info (immediate UX)
    setAuth(
      {
        id: '',   // will be overwritten after /me fetch
        name: session?.user?.name || '',
        email: session?.user?.email || '',
      },
      backendToken
    );

    // Then fetch the real backend user to get the correct DB id + role
    fetch('/api/backend/auth/me', {
      headers: { Authorization: `Bearer ${backendToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (user) {
          setAuth(
            {
              id: String(user.id),
              name: user.name || session?.user?.name || '',
              email: user.email || session?.user?.email || '',
            },
            backendToken
          );
        }
      })
      .catch(() => { /* non-fatal — basic info already set */ });
  }, [session, status, currentToken, isAuthenticated, setAuth, logout]);

  return null;
}

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <TokenBridge />
      {children}
    </SessionProvider>
  );
}
