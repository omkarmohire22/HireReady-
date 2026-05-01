'use client';
import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

function getStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { label: 'Weak',      color: '#FF4D6A' },
    { label: 'Fair',      color: '#FFB547' },
    { label: 'Strong',    color: '#00E5FF' },
    { label: 'Very Strong', color: '#00D97E' },
  ];

  return { score, ...levels[Math.max(0, score - 1)] };
}

export function getPasswordRequirements(pwd: string) {
  return [
    { label: 'At least 8 characters',    met: pwd.length >= 8 },
    { label: 'One uppercase letter',      met: /[A-Z]/.test(pwd) },
    { label: 'One number',               met: /[0-9]/.test(pwd) },
    { label: 'One special character',    met: /[^A-Za-z0-9]/.test(pwd) },
  ];
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  const requirements = getPasswordRequirements(password);

  return (
    <div style={{ marginTop: -8 }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: n <= score ? color : 'var(--border-strong)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>
      <div style={{
        fontSize: 12, fontWeight: 600, color, marginBottom: 16,
      }}>
        {label}
      </div>

      {/* Requirements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'reapto-fit, minmax(140px, 1fr)', gap: 8 }}>
        {requirements.map(req => (
          <div key={req.label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: req.met ? '#00D97E' : 'var(--text-muted)',
            transition: 'color 0.2s',
          }}>
            <span style={{ fontSize: 10 }}>{req.met ? '✓' : '○'}</span>
            {req.label}
          </div>
        ))}
      </div>
    </div>
  );
}
