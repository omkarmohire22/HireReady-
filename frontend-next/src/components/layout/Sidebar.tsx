'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import {
  BrainCircuit, LayoutDashboard, Mic2, BarChart3,
  BookOpen, UserCircle, Settings, LogOut,
} from 'lucide-react';

const NAV = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Practice',  href: '/practice',  icon: Mic2 },
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
    localStorage.removeItem("token");
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/auth/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo-area">
        <Link href="/dashboard" className="sidebar-brand" onClick={onClose}>
          <div className="brand-icon" style={{ overflow: 'hidden' }}>
            <img 
              src="/logo.png" 
              alt="HireReady Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onClose}
                  className={`nav-link ${active ? 'active' : ''}`}>
                  {active && <span className="nav-link-indicator" />}
                  <span className="nav-icon-wrap"><Icon size={15} /></span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="nav-group-label">Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ACCOUNT_NAV.map(item => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onClose}
                  className={`nav-link ${active ? 'active' : ''}`}>
                  {active && <span className="nav-link-indicator" />}
                  <span className="nav-icon-wrap"><Icon size={15} /></span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Quick Stats */}
      <div className="sidebar-stats">
        <p className="nav-group-label" style={{ padding: 0, marginBottom: 12 }}>Your Progress</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#00E5FF', marginBottom: 2 }}>12</p>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sessions</p>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#6C47FF', marginBottom: 2 }}>78%</p>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Avg</p>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#FFB547', marginBottom: 2 }}>4🔥</p>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Streak</p>
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </p>
          </div>
          <button onClick={handleLogout} style={{
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 6,
          }} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
