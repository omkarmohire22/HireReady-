'use client';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'oauth';
  fullWidth?: boolean;
  id?: string;
}

export default function AuthButton({
  children, onClick, type = 'button', loading = false,
  disabled = false, variant = 'primary', fullWidth = true, id,
}: AuthButtonProps) {
  const reduceMotion = useReducedMotion();
  const hoverMotion = disabled || loading || reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapMotion = disabled || loading || reduceMotion ? undefined : { scale: 0.98 };
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    border: 'none', borderRadius: 12, fontWeight: 600,
    width: fullWidth ? '100%' : 'auto',
    transition: 'transform 0.15s, box-shadow 0.15s, filter 0.15s',
    textDecoration: 'none',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
      color: '#fff', height: 48,
      fontSize: 15,
    },
    ghost: {
      background: 'transparent',
      border: '1px solid var(--border-strong)',
      color: 'var(--text-muted)',
      height: 48, fontSize: 14,
    },
    oauth: {
      background: 'var(--bg-interactive)',
      border: '1px solid var(--border-soft)',
      color: 'var(--text-high)',
      height: 48, fontSize: 14, fontWeight: 600,
    },
  };

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={hoverMotion}
      whileTap={tapMotion}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => {
        if (disabled || loading) return;
        const el = e.currentTarget as HTMLElement;
        if (variant === 'primary') {
          el.style.transform = 'translateY(-2px)';
          el.style.boxShadow = '0 8px 24px var(--primary-glow)';
          el.style.filter = 'brightness(1.05)';
        } else if (variant === 'oauth') {
          el.style.borderColor = 'var(--indigo)';
          el.style.background = 'var(--elevated)';
        } else {
          el.style.background = 'var(--elevated)';
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
        el.style.filter = '';
        if (variant === 'oauth') {
          el.style.borderColor = 'var(--border-soft)';
          el.style.background = 'var(--bg-interactive)';
        } else if (variant === 'ghost') {
          el.style.background = 'transparent';
        }
      }}
      onMouseDown={e => {
        if (variant === 'primary' && !disabled && !loading) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.filter = 'brightness(0.95)';
        }
      }}
    >
      {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : children}
    </motion.button>
  );
}
