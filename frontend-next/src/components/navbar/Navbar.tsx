'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Menu, X, User, LogOut,
  LayoutDashboard, Mic2, BarChart3, BookOpen, UserCircle, Sun, Moon,
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

const NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { name: 'Practice',  path: '/practice',  icon: <Mic2 className="w-4 h-4" /> },
  { name: 'Report',    path: '/report',    icon: <BarChart3 className="w-4 h-4" /> },
  { name: 'Roadmap',   path: '/roadmap',   icon: <BookOpen className="w-4 h-4" /> },
  { name: 'Profile',   path: '/profile',   icon: <UserCircle className="w-4 h-4" /> },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isDark, toggle } = useTheme();

  // Hide on landing / auth
  if (pathname === '/' || pathname === '/auth') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(4,11,26,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            HireReady
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map((link) => {
            const active = pathname === link.path;
            return (
              <Link key={link.path} href={link.path}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold no-underline transition-all duration-200"
                style={{
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: active ? 'var(--text-primary)' : '#64748b',
                  border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
              >
                {link.icon} {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <button onClick={toggle}
            className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Profile Icon */}
          <Link href="/profile"
            className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center no-underline transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer' }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(4,11,26,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV.map((link) => {
                const active = pathname === link.path;
                return (
                  <Link key={link.path} href={link.path} onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold no-underline transition-all"
                    style={{
                      background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                      color: active ? 'var(--text-primary)' : '#64748b',
                    }}
                  >
                    {link.icon} {link.name}
                  </Link>
                );
              })}
              <div className="mt-2 pt-3 border-t border-white/5 flex items-center gap-2">
                <button onClick={toggle}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold w-full"
                  style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  {isDark ? <><Sun className="w-4 h-4" /> Light Mode</> : <><Moon className="w-4 h-4" /> Dark Mode</>}
                </button>
                <button
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold w-full"
                  style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
