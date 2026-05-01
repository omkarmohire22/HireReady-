'use client';
import { Menu, Mic, X } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';

const links = ['Features', 'How It Works', 'Dashboard'];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050A14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <div className="flex items-center gap-3 text-xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#6C47FF] to-[#00E5FF] p-1.5 shadow-lg shadow-purple-500/20">
            <img src="/logo.png" alt="HireReady" className="h-full w-full object-contain brightness-0 invert" />
          </div>
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text font-[var(--font-heading)] text-transparent">HireReady</span>
        </div>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {links.map((item) => <a key={item} href="#" className="hover:text-white">{item}</a>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost">Login</Button>
          <Button>Get Started</Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-[#0D1526] p-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {links.map((item) => <a key={item} href="#" className="text-slate-300">{item}</a>)}
            <Button variant="ghost" className="w-full">Login</Button>
            <Button className="w-full">Get Started</Button>
          </div>
        </div>
      )}
    </header>
  );
}
