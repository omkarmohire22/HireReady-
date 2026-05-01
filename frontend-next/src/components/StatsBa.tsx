'use client';
import { Database, Lock, MessageSquareText, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { label: '9 AI Models', icon: Database },
  { label: '100% Offline', icon: Lock },
  { label: 'Voice + Text', icon: MessageSquareText },
  { label: 'Instant Feedback', icon: Zap },
];

export default function StatsBa() {
  return (
    <section className="border-y border-white/10 bg-[#0b1221]">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 py-7 md:grid-cols-4 md:px-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
            <s.icon size={16} className="text-[#6C63FF]" />
            <p className="mt-2 text-lg font-semibold text-white">{s.label}</p>
            <p className="text-xs text-slate-400">Platform capability</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
