'use client';
import React, { useState } from 'react';
import { Menu, Bell, Sun, Moon, Search, Command } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { usePathname } from 'next/navigation';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/practice':  'Practice Arena',
  '/report':    'Reports',
  '/roadmap':   'Learning Roadmap',
  '/profile':   'My Profile',
  '/settings':  'Settings',
};

interface TopBarProps { onMenuClick: () => void; }

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { isDark, toggle } = useTheme();
  const pathname = usePathname();

  const pageName = Object.entries(PAGE_NAMES)
    .find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] ?? 'HireReady';

  return (
    <header className="topbar">
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Hamburger (mobile) */}
        <button
          onClick={onMenuClick}
          className="md:hidden topbar-icon-btn"
          style={{ width: 34, height: 34, borderRadius: 10 }}
        >
          <Menu size={16} />
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-low)' }}>HireReady</span>
          <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>
            {pageName}
          </span>
        </div>
        <span className="sm:hidden" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>
          {pageName}
        </span>
      </div>

      {/* Center: Search (desktop) */}
      <div className="hidden md:flex topbar-search">
        <Search size={14} style={{ color: 'var(--text-med)' }} />
        <input 
          placeholder="Search..."
          style={{ 
            flex: 1, background: 'transparent', border: 'none', outline: 'none', 
            fontSize: 13, color: 'var(--text-high)'
          }}
        />
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 3, 
          padding: '2px 5px', borderRadius: 4, 
          background: 'var(--bg-interactive)', border: '1px solid var(--border-soft)'
        }}>
          <Command size={10} style={{ color: 'var(--text-med)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-med)' }}>K</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Mobile search */}
        <button className="md:hidden topbar-icon-btn">
          <Search size={15} />
        </button>

        {/* Theme toggle */}
        <button onClick={toggle} className="topbar-icon-btn" title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <button className="topbar-icon-btn" style={{ position: 'relative' }}>
          <Bell size={15} />
          <span
            style={{
              position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%',
              background: 'var(--indigo)', boxShadow: '0 0 8px var(--indigo)'
            }}
          />
        </button>
      </div>
    </header>
  );
}
