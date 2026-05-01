'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, ChartColumnBig, LayoutDashboard, Mic, Route, Settings, User, History } from 'lucide-react';
import { motion } from 'framer-motion';

const items = [
  { href: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/practice',  label: 'Practice',        icon: Mic },
  { href: '/report',    label: 'Reports',          icon: ChartColumnBig },
  { href: '/history',   label: 'Session History',  icon: History },
  { href: '/roadmap',   label: 'Roadmap',          icon: Route },
  { href: '/profile',   label: 'Profile',          icon: User },
  { href: '/settings',  label: 'Settings',         icon: Settings },
];

export default function Sidebar({ closeMobile }: { closeMobile?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#0D1526]/70 p-4 backdrop-blur-xl">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 text-lg font-semibold font-[var(--font-heading)]"><Brain size={18} className="text-[#6C63FF]" />HireReady</Link>
      <nav className="space-y-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <motion.div whileHover={{ x: 2 }} key={item.href}>
              <Link onClick={closeMobile} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active ? 'bg-[#6C63FF]/20 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                <Icon size={15} />{item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
