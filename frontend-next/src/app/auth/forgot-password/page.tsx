'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2 } from 'lucide-react';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const masked = email ? `${email.slice(0, 2)}****@${email.split('@')[1] ?? 'example.com'}` : 'you****@example.com';

  const handleSubmit = async () => {
    if (!email.includes('@')) { setError('Please enter a valid email'); return; }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32,
          color: 'var(--text-high)', marginBottom: 8,
        }}>
          Reset Password
        </h1>
        {!submitted && (
          <p style={{
            fontSize: 14, color: 'var(--text-muted)',
          }}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        )}
      </div>

      {!submitted ? (
        <>
          <AuthInput id="forgot-email" label="Email Address" type="email"
            placeholder="you@example.com" icon={Mail}
            value={email} onChange={setEmail} error={error} />

          <AuthButton id="forgot-submit" loading={loading} onClick={handleSubmit}>
            Send Reset Link
          </AuthButton>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/auth/login" style={{
              fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none',
              transition: 'color 0.2s'
            }} onMouseEnter={e => (e.currentTarget.style.color = '#6C47FF')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              ← Back to Login
            </Link>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center' }} className="fade-up">
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(0, 217, 126, 0.1)', border: '1px solid rgba(0, 217, 126, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle2 size={40} color="#00D97E" />
          </div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 24,
            color: 'var(--text-high)', marginBottom: 12,
          }}>
            Check your inbox
          </h2>
          <p style={{
            fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6,
          }}>
            We sent a password reset link to<br />
            <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{masked}</span>
          </p>

          <a href={`mailto:${email}`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
            color: '#fff', textDecoration: 'none',
            fontWeight: 600, fontSize: 15, marginBottom: 24,
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px var(--primary-glow)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            Open Email App
          </a>

          <Link href="/auth/login" style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none',
          }} onMouseEnter={e => (e.currentTarget.style.color = '#6C47FF')}
             onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            ← Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}
