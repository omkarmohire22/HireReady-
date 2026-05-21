'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Mail, Lock } from 'lucide-react';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useAuthStore } from '@/lib/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const setAuth = useAuthStore(state => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  /**
   * After Google OAuth, NextAuth session contains the backendToken.
   * Use it to hydrate our Zustand store + localStorage and redirect.
   */
  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.backendToken) {
      const backendToken = (session as any).backendToken as string;
      localStorage.setItem('token', backendToken);
      document.cookie = `auth-token=${backendToken}; path=/; max-age=604800;`;

      // Fetch user profile from our backend
      import('@/lib/api').then(({ api }) => {
        api.getMe()
          .then(user => {
            setAuth(user, backendToken);
            const params = new URLSearchParams(window.location.search);
            router.push(params.get('from') || '/dashboard');
          })
          .catch(() => {
            router.push('/dashboard');
          });
      });
    }
  }, [status, session, setAuth, router]);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.includes('@')) e.email = 'Please enter a valid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const { api } = await import('@/lib/api');
      const res = await api.login({ email, password });

      if (res.access_token) {
        localStorage.setItem('token', res.access_token);
        document.cookie = `auth-token=${res.access_token}; path=/; max-age=604800;`;

        try {
          const userRes = await api.getMe();
          setAuth(userRes, res.access_token);
        } catch (e) {
          console.error('Failed to fetch user profile', e);
        }

        const searchParams = new URLSearchParams(window.location.search);
        router.push(searchParams.get('from') || '/dashboard');
      }
    } catch (err: any) {
      setErrors({ password: err.message || 'Login failed. Please check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } catch {
      setErrors({ general: 'Google sign-in failed. Please try again.' });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32,
          color: 'var(--text-high)', marginBottom: 8,
        }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Sign in to your HireReady account to continue.
        </p>
      </div>

      {/* General error */}
      {errors.general && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          color: '#f87171', fontSize: 13, textAlign: 'center',
        }}>
          {errors.general}
        </div>
      )}

      {/* Form */}
      <form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
        <AuthInput id="login-email" label="Email Address" type="email"
          placeholder="you@example.com"
          icon={Mail} value={email} onChange={setEmail} error={errors.email} />

        <AuthInput id="login-password" label="Password" type="password"
          placeholder="Enter your password"
          icon={Lock} value={password} onChange={setPassword} error={errors.password}
          autoComplete="current-password" />

        {/* Remember + Forgot */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, marginTop: -8,
        }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            fontSize: 13, color: 'var(--text-muted)',
          }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              style={{ accentColor: '#6C47FF', width: 14, height: 14 }} />
            Remember me
          </label>
          <a href="/auth/forgot-password" style={{
            fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600,
          }}>
            Forgot password?
          </a>
        </div>

        <AuthButton type="submit" loading={loading} id="login-submit">
          Sign In
        </AuthButton>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
        <span style={{
          fontSize: 11, color: 'var(--text-subtle)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
      </div>

      {/* OAuth buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <AuthButton
          variant="oauth"
          fullWidth
          id="google-login"
          loading={googleLoading}
          onClick={handleGoogleLogin}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Redirecting...' : 'Google'}
        </AuthButton>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        Don&apos;t have an account?{' '}
        <a href="/auth/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
          Sign up
        </a>
      </p>
    </div>
  );
}
