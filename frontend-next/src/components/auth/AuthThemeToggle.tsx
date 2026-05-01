'use client';
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function AuthThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
      <button onClick={toggle} style={{
        width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-interactive)', color: 'var(--text-muted)',
        transition: 'background 0.2s, color 0.2s'
      }} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
         onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-high)' }}
         onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
