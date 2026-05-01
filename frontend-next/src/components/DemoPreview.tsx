'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import ScoreGauge from '@/components/ui/ScoreGauge';
import WaveformBar from '@/components/ui/WaveformBar';

export default function DemoPreview() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <h2 className="text-center font-[var(--font-heading)] text-3xl md:text-4xl">See HireReady in action</h2>
      <motion.div style={{ y }} className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1526]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /><span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-2 rounded-md bg-black/20 px-3 py-1 text-xs text-slate-400">hireready.local/dashboard</div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="glass-card p-5">
            <p className="text-sm text-slate-400">Interview Panel</p>
            <h3 className="mt-2 text-lg">How would you scale a URL shortener?</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="mic-pulse h-12 w-12 rounded-full bg-red-500/90" />
              <WaveformBar />
            </div>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-slate-400">Feedback Breakdown</p>
            <ScoreGauge value={78} />
            {['Technical', 'Pace', 'Confidence', 'Clarity'].map((metric, idx) => (
              <div key={metric} className="mt-3">
                <div className="mb-1 flex justify-between text-xs"><span>{metric}</span><span>{70 + idx * 5}%</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#6C63FF]" style={{ width: `${70 + idx * 5}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
