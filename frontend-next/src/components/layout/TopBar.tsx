'use client';
import React from 'react';
import { Menu, Bell, Sun, Moon, Search, Command } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { usePathname } from 'next/navigation';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/practice':  'Practice Arena',
  '/report':    'Reports',
  '/history':   'Session History',
  '/roadmap':   'Learning Roadmap',
  '/profile':   'My Profile',
  '/settings':  'Settings',
  '/upgrade':   'Upgrade Plan',
};

interface TopBarProps { onMenuClick: () => void; }

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { isDark, toggle } = useTheme();
  const pathname = usePathname();

  const pageName = Object.entries(PAGE_NAMES)
    .find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] ?? 'HireReady';

  return (
    <header style={{
      height: 56,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 30,   /* below sidebar (40) so sidebar stays on top */
      gap: 12,
    }}>
      {/* Left — hamburger + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          className="md:hidden"
          style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Menu size={15} />
        </button>

        {/* Breadcrumb — desktop */}
        <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
            HireReady
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-faint)', userSelect: 'none' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-med)', whiteSpace: 'nowrap' }}>
            {pageName}
          </span>
        </div>

        {/* Page name — mobile only */}
        <span className="sm:hidden" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {pageName}
        </span>
      </div>

      {/* Center — search bar */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1,
          maxWidth: 280,
          height: 32,
          background: 'var(--elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0 10px',
          alignItems: 'center',
          gap: 8,
          margin: '0 16px',
        }}
      >
        <Search size={13} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
        <input
          placeholder="Search..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--text-med)',
            fontFamily: 'var(--font-sans)',
            minWidth: 0,
          }}
        />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '2px 5px', borderRadius: 4,
          background: 'var(--overlay)',
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <Command size={9} style={{ color: 'var(--text-subtle)' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', lineHeight: 1 }}>K</span>
        </div>
      </div>

      {/* Right — action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Mobile search */}
        <button
          className="md:hidden"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Search size={14} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Light mode' : 'Dark mode'}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--elevated)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Notifications */}
        <button
          title="Notifications"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--elevated)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          <Bell size={14} />
          {/* Notification dot — top-right corner of icon, not button */}
          <span style={{
            position: 'absolute',
            top: 7,
            right: 7,
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--teal)',
            border: '1.5px solid var(--nav-bg)',
            pointerEvents: 'none',
          }} />
        </button>
      </div>
    </header>
  );
}
