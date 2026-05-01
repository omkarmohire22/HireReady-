'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck } from 'lucide-react';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import PasswordStrength, { getPasswordRequirements } from '@/components/auth/PasswordStrength';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const requirements = getPasswordRequirements(password);
  const allMet = requirements.every(r => r.met);
  const passwordsMatch = password === confirm && confirm.length > 0;

  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) { router.push('/auth/login'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, router]);

  const handleSubmit = async () => {
    const e: typeof errors = {};
    if (!allMet) e.password = 'Password does not meet all requirements';
    if (!passwordsMatch) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32,
          color: 'var(--text-high)', marginBottom: 8,
        }}>
          Create New Password
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--text-muted)',
        }}>
          Please enter your new strong password below.
        </p>
      </div>

      {!success ? (
        <>
          <AuthInput id="reset-password" label="New Password" type="password"
            placeholder="Create a new password" icon={Lock}
            value={password} onChange={setPassword} error={errors.password} />
          
          <div style={{ marginBottom: 20 }}>
            <PasswordStrength password={password} />
          </div>

          <AuthInput id="reset-confirm" label="Confirm Password" type="password"
            placeholder="Repeat your new password" icon={Lock}
            value={confirm} onChange={setConfirm} error={errors.confirm} />

          {/* Match indicator */}
          {confirm.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7, marginTop: -12, marginBottom: 24,
              fontSize: 12, fontWeight: 500,
              color: passwordsMatch ? '#00D97E' : '#FF4D6A',
            }}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}

          <AuthButton id="reset-submit" loading={loading} onClick={handleSubmit}>
            Reset Password
          </AuthButton>
        </>
      ) : (
        <div style={{ textAlign: 'center' }} className="fade-up">
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(0, 217, 126, 0.1)', border: '1px solid rgba(0, 217, 126, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <ShieldCheck size={40} color="#00D97E" />
          </div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 24,
            color: '#00D97E', marginBottom: 12,
          }}>
            Password Reset Complete
          </h2>
          <p style={{
            fontSize: 14, color: 'var(--text-muted)',
          }}>
            Redirecting you to login in <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{countdown}</span>...
          </p>
        </div>
      )}
    </div>
  );
}
