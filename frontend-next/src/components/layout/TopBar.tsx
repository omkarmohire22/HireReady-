'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

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
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageName = Object.entries(PAGE_NAMES)
    .find(([k]) => pathname === k || (pathname?.startsWith(k + '/') ?? false))?.[1] ?? 'HireReady';

  // Fetch notifications from the backend
  const fetchNotifications = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await api.markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark read:', err);
      fetchNotifications(); // Rollback/refresh
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await api.markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all read:', err);
      fetchNotifications();
    }
  };

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

      {/* Right — action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative' }}>
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
          onClick={() => {
            setShowDropdown(prev => !prev);
            fetchNotifications();
          }}
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
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--teal)',
              border: '1.5px solid var(--nav-bg)',
              pointerEvents: 'none',
            }} />
          )}
        </button>

        {/* Notifications Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 40,
              right: 0,
              width: 320,
              maxHeight: 380,
              background: 'var(--card-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--nav-bg)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-med)' }}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--teal)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      background: n.read ? 'transparent' : 'var(--elevated)',
                      cursor: n.read ? 'default' : 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: n.read ? 500 : 700,
                        color: n.read ? 'var(--text-subtle)' : 'var(--text)',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        {n.title}
                        {!n.read && (
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--teal)',
                            display: 'inline-block',
                          }} />
                        )}
                      </div>
                      <p style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.4,
                      }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
