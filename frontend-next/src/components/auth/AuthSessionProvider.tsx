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
  const { data: session } = useSession();
  const setAuth = useAuthStore(s => s.setAuth);
  const currentToken = useAuthStore(s => s.token);

  useEffect(() => {
    const backendToken = (session as any)?.backendToken;
    if (!backendToken || backendToken === currentToken) return;

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
  }, [session, currentToken, setAuth]);

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
