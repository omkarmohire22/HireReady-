'use client';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

type Props = { label: string; value: string; icon: LucideIcon };

export default function StatCard({ label, value, icon: Icon }: Props) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} className="glass-card rounded-xl bg-gradient-to-br from-white/10 to-transparent p-5 transition hover:shadow-[0_0_24px_rgba(108,99,255,0.25)]">
      <div className="flex items-center gap-3"><div className="rounded-lg bg-[#6C63FF]/20 p-2"><Icon size={16} className="text-[#6C63FF]" /></div><span className="text-xs text-slate-400">{label}</span></div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}
