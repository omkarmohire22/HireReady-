'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setAuth, logout } = useAuthStore();
  const { data: session } = useSession();

  // Landing page and auth pages get no shell
  const isFullPage = pathname === '/' || (pathname?.startsWith('/auth') ?? false);

  useEffect(() => {
    if (isFullPage) return;

    let isMounted = true;

    const verifyToken = async () => {
      try {
        const { api } = await import('@/lib/api');

        // 1. Check regular email/password token from localStorage
        let token = localStorage.getItem('token');

        // 2. If no localStorage token, check NextAuth Google session
        if (!token && (session as any)?.backendToken) {
          token = (session as any).backendToken as string;
          // Persist it so other parts of the app can use it
          localStorage.setItem('token', token);
          document.cookie = `auth-token=${token}; path=/; max-age=604800;`;
        }

        if (!token) throw new Error('No token');

        const userRes = await api.getMe();
        if (isMounted) setAuth(userRes, token);
      } catch (e) {
        if (isMounted) {
          logout();
          localStorage.removeItem('token');
          document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          router.push('/auth/login');
        }
      }
    };

    verifyToken();
    return () => { isMounted = false; };
  }, [isFullPage, setAuth, logout, router, session]);

  if (isFullPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Desktop Sidebar — fixed, hidden on mobile */}
      <div
        className="hidden md:block"
        style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: 256, zIndex: 40 }}
      >
        <Sidebar />
      </div>

      {/* Mobile overlay + drawer */}
      {sidebarOpen && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, zIndex: 50, height: '100vh', width: 256 }}>
            <Sidebar closeMobile={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content area */}
      <div
        className="md:ml-64"
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: '100vh' }}
      >
        <TopBar onMenuClick={() => setSidebarOpen(v => !v)} />
        <main style={{ flex: 1, padding: '28px 24px', overflowX: 'hidden', marginTop: 56 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
