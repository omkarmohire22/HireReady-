'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OTPInput from '@/components/auth/OTPInput';
import AuthButton from '@/components/auth/AuthButton';

export default function VerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const maskedEmail = 'om****@example.com';

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSuccess(true);
    document.cookie = 'auth-token=dummy_token; path=/; max-age=86400;';
    setTimeout(() => router.push('/dashboard'), 1800);
  };

  const handleResend = () => {
    setCountdown(60);
    setCanResend(false);
    setOtp(Array(6).fill(''));
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32,
          color: 'var(--text-high)', marginBottom: 8,
        }}>
          Check your email
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          We&apos;ve sent a 6-digit verification code to
          <br />
          <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{maskedEmail}</span>
        </p>
      </div>

      <div style={{ marginBottom: 32 }}>
        <OTPInput value={otp} onChange={setOtp} success={success} />
      </div>

      {/* Countdown / Resend */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {canResend ? (
          <button onClick={handleResend} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#6C47FF',
          }}>
            Resend Code
          </button>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Resend code in <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>0:{String(countdown).padStart(2, '0')}</span>
          </span>
        )}
      </div>

      <AuthButton
        id="otp-verify" loading={loading} disabled={otp.join('').length < 6}
        onClick={handleVerify}
      >
        {success ? 'Redirecting...' : 'Verify Email'}
      </AuthButton>
    </div>
  );
}
