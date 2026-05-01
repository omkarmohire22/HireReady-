'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

type Props = { company: string; role: string; date: string; score: number };

export default function InterviewCard({ company, role, date, score }: Props) {
  const reduceMotion = useReducedMotion();
  const hoverMotion = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  return (
    <motion.div
      className="glass-card flex items-center justify-between rounded-xl p-4 transition hover:border-white/20 hover:bg-white/5"
      whileHover={hoverMotion}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00D4AA]" />
        <div>
          <p className="text-sm font-semibold">{role}</p>
          <p className="text-xs text-slate-400">{company} • {date}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-[#00D4AA]/20 px-2 py-1 text-xs text-[#8bf5df]">{score}%</span>
        <button className="ghost-btn px-3 py-2 text-xs">View Feedback <ArrowUpRight size={12} /></button>
      </div>
    </motion.div>
  );
}
