'use client';
import React, { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string[];
  onChange: (val: string[]) => void;
  success?: boolean;
}

export default function OTPInput({ length = 6, value, onChange, success = false }: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (idx: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const next = [...value];
        next[idx] = '';
        onChange(next);
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = Array(length).fill('');
    text.split('').forEach((ch, i) => { next[i] = ch; });
    onChange(next);
    const focusIdx = Math.min(text.length, length - 1);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length }).map((_, idx) => {
        const filled = Boolean(value[idx]);
        const borderColor = success
          ? '#00D97E'
          : filled
          ? '#6C47FF'
          : 'var(--border-strong)';
        const glowColor = success
          ? 'rgba(0, 217, 126, 0.2)'
          : filled
          ? 'rgba(108, 71, 255, 0.2)'
          : 'none';

        return (
          <input
            key={idx}
            ref={el => { refs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[idx] || ''}
            onChange={e => handleChange(idx, e.target.value)}
            onKeyDown={e => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            style={{
              width: 52, height: 60,
              background: 'var(--input-bg)',
              border: `1px solid ${borderColor}`,
              borderRadius: 12, outline: 'none',
              fontFamily: 'monospace',
              fontSize: 26, fontWeight: 700,
              color: success ? '#00D97E' : filled ? '#6C47FF' : 'var(--text-high)',
              textAlign: 'center',
              boxShadow: filled ? `0 0 0 3px ${glowColor}` : 'none',
              transform: filled ? 'scale(1.03)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          />
        );
      })}
    </div>
  );
}
