'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Mic2, BarChart3,
  BookOpen, UserCircle, Settings, LogOut, Flame, FileText
} from 'lucide-react';

const NAV = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Practice',  href: '/practice',  icon: Mic2 },
  { name: 'Resume Analyzer', href: '/resume', icon: FileText },
  { name: 'Reports',   href: '/report',    icon: BarChart3 },
  { name: 'Roadmap',   href: '/roadmap',   icon: BookOpen },
] as const;

const ACCOUNT_NAV = [
  { name: 'Profile',  href: '/profile',  icon: UserCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
] as const;

interface SidebarProps { closeMobile?: () => void; }

export default function Sidebar({ closeMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const onClose = closeMobile ?? (() => {});
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    signOut({ callbackUrl: '/auth/login' });
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo-area">
        <Link href="/dashboard" className="sidebar-brand" onClick={onClose}>
          <div className="brand-icon">
            <img
              src="/logo.png"
              alt="HireReady"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <span className="brand-name">HireReady</span>
            <span className="brand-tag">AI Interview Coach</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div>
          <p className="nav-group-label">Main</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NAV.map(item => {
              const active = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`nav-link ${active ? 'active' : ''}`}
                >
                  {active && <span className="nav-link-indicator" />}
                  <span className="nav-icon-wrap">
                    <Icon size={15} />
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="nav-group-label">Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ACCOUNT_NAV.map(item => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`nav-link ${active ? 'active' : ''}`}
                >
                  {active && <span className="nav-link-indicator" />}
                  <span className="nav-icon-wrap">
                    <Icon size={15} />
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Quick Stats */}
      <div className="sidebar-stats">
        <p className="nav-group-label" style={{ padding: 0, marginBottom: 10 }}>Your Progress</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>12</p>
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)' }}>Sessions</p>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--purple)', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>78%</p>
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)' }}>Avg</p>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber)', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              4 <Flame size={12} color="var(--amber)" />
            </p>
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)' }}>Streak</p>
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-subtle)',
              cursor: 'pointer', borderRadius: 7, flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-subtle)'; }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
