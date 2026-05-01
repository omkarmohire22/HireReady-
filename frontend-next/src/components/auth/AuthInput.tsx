'use client';
import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

export interface AuthInputProps {
  label?: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  icon: LucideIcon;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  rightElement?: React.ReactNode;
  autoComplete?: string;
  id?: string;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, type, placeholder, icon: Icon, value, onChange, error, rightElement, autoComplete, id }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPwd ? 'text' : 'password') : type;

    const borderColor = error
      ? '#FF4D6A'
      : focused
      ? '#6C47FF'
      : 'var(--border-strong)';

    const boxShadow = error
      ? '0 0 0 3px rgba(255, 77, 106, 0.15)'
      : focused
      ? '0 0 0 3px rgba(108, 71, 255, 0.2)'
      : 'none';

    const iconColor = error ? '#FF4D6A' : focused ? '#6C47FF' : 'var(--text-muted)';

    return (
      <div style={{ marginBottom: 20 }}>
        {label && (
          <label htmlFor={id} style={{
            display: 'block', fontSize: 13, fontWeight: 600,
            color: 'var(--text-muted)', marginBottom: 8,
          }}>
            {label}
          </label>
        )}

        <div style={{ position: 'relative' }}>
          {/* Left icon */}
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', transition: 'color 0.2s', color: iconColor,
            display: 'flex', alignItems: 'center',
          }}>
            <Icon size={18} />
          </span>

          <input
            ref={ref}
            id={id}
            type={inputType}
            placeholder={placeholder}
            value={value}
            autoComplete={autoComplete}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: '100%',
              background: 'var(--input-bg)',
              border: `1px solid ${borderColor}`,
              borderRadius: 12,
              padding: `14px 16px 14px ${isPassword || rightElement ? '44px' : '44px'}`,
              paddingRight: isPassword ? '44px' : rightElement ? '44px' : '16px',
              color: 'var(--text-high)',
              fontSize: 15,
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow,
            }}
          />

          {/* Password toggle */}
          {isPassword && (
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              transition: 'color 0.2s', padding: 4, borderRadius: 6,
            }} title={showPwd ? "Hide password" : "Show password"}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}

          {/* Custom right element */}
          {!isPassword && rightElement && (
            <span style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center',
            }}>
              {rightElement}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p style={{
            fontSize: 13, color: '#FF4D6A', marginTop: 8, fontWeight: 500
          }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
export default AuthInput;
