'use client';
import { Bell, Menu, Search } from 'lucide-react';

export default function DashboardNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#050A14]/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-lg border border-white/10 p-2 md:hidden"><Menu size={16} /></button>
        <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 md:flex">
          <Search size={14} className="text-slate-400" />
          <span className="text-sm text-slate-400">Search interviews</span>
        </div>
      </div>
      <button className="rounded-lg border border-white/10 p-2"><Bell size={16} /></button>
    </header>
  );
}
