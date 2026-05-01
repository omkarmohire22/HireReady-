'use client';
import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import WaveformBar from '@/components/ui/WaveformBar';

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-5 md:px-8">
      <div className="md:col-span-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><Badge>AI-Powered Interview Coach</Badge></motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-5 font-[var(--font-heading)] text-5xl leading-[0.98] tracking-tight text-white md:text-7xl">Practice. Speak. Get Hired.</motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-5 max-w-xl text-slate-300">Upload your resume, get AI-generated voice questions, and receive instant feedback on what you said and how you said it.</motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-7 flex flex-wrap gap-3">
          <Button>Start Interview →</Button>
          <Button variant="ghost"><Play size={15} />Watch Demo</Button>
        </motion.div>
        <div className="mt-8 flex items-center gap-4 text-sm text-slate-300">
          <div className="flex -space-x-2">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-8 w-8 rounded-full border border-[#050A14] bg-gradient-to-br from-[#6C63FF] to-[#00D4AA]" />)}</div>
          <p>Trusted by 2,000+ MCA students</p><Star size={14} className="fill-[#00D4AA] text-[#00D4AA]" /><span>4.9</span>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2">
        <GlassCard className="float-card space-y-4 p-6">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-slate-200">Explain Docker containerisation.</div>
          <div className="flex items-center gap-3">
            <div className="mic-pulse h-10 w-10 rounded-full bg-red-500/90" />
            <WaveformBar />
          </div>
          <div className="inline-flex rounded-md border border-[#00D4AA]/30 bg-[#00D4AA]/10 px-3 py-1 text-xs text-[#7df2d7]">Score: 7.8/10 | Pace: 142 WPM ✓</div>
        </GlassCard>
      </motion.div>
    </section>
  );
}
