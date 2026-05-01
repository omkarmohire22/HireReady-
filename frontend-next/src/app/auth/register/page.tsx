'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock } from 'lucide-react';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { useAuthStore } from '@/lib/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email.includes('@')) e.email = 'Enter a valid email';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { api } = await import('@/lib/api');
      
      // 1. Register the user
      await api.register({ email, password, name });
      
      // 2. Automatically log them in
      const loginRes = await api.login({ email, password });
      
      if (loginRes.access_token) {
        localStorage.setItem("token", loginRes.access_token);
        document.cookie = `auth-token=${loginRes.access_token}; path=/; max-age=86400;`;
        
        // 3. Fetch user info to populate auth store
        try {
          const userRes = await api.getMe();
          setAuth(userRes, loginRes.access_token);
        } catch (e) {
          console.error("Failed to fetch user profile", e);
        }
        
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrors({ ...errors, password: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32,
          color: 'var(--text-high)', marginBottom: 8,
        }}>Create an Account</h1>
        <p style={{
          fontSize: 14, color: 'var(--text-muted)',
        }}>
          Join HireReady and start acing your interviews.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <AuthInput id="reg-name" label="Full Name" type="text"
          placeholder="e.g. John Doe" icon={User}
          value={name} onChange={setName} error={errors.name} />
        
        <AuthInput id="reg-email" label="Email Address" type="email"
          placeholder="you@example.com" icon={Mail}
          value={email} onChange={setEmail} error={errors.email} />
        
        <AuthInput id="reg-password" label="Password" type="password"
          placeholder="Create a strong password" icon={Lock}
          value={password} onChange={setPassword} error={errors.password} />
        
        <div style={{ marginBottom: 24 }}>
          <PasswordStrength password={password} />
        </div>

        <AuthButton id="reg-submit" loading={loading} type="submit">
          Sign Up
        </AuthButton>
      </form>

      <p style={{
        textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24,
      }}>
        Already have an account?{' '}
        <a href="/auth/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </a>
      </p>
    </div>
  );
}
