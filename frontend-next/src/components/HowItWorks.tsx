'use client';
import { motion } from 'framer-motion';

const steps = [
  ['Upload Resume', 'Add your latest resume to get personalized prep.'],
  ['Pick Job Role', 'Select role and target company profile.'],
  ['See Skill Gaps', 'We map missing skills against requirements.'],
  ['Hear AI Questions', 'Role-specific questions are read out naturally.'],
  ['Speak Your Answer', 'Respond like a real interview setting.'],
  ['Get Feedback Report', 'Review scores, communication and improvements.'],
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <h2 className="text-center font-[var(--font-heading)] text-3xl md:text-4xl">From resume to offer letter in 6 steps</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-6">
        {steps.map((step, i) => (
          <motion.div key={step[0]} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative rounded-xl border border-dashed border-white/20 p-4">
            <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#6C63FF] text-sm font-semibold">{i + 1}</span>
            <h3 className="text-sm font-semibold">{step[0]}</h3>
            <p className="mt-2 text-xs text-slate-400">{step[1]}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
