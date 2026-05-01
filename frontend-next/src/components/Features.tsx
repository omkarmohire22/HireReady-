'use client';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

const features = [
  ['🎤', 'Voice-Based Interviews', 'Speak your answers. Hear the questions. Just like a real interview room.'],
  ['🧠', 'AI Question Generation', 'Fine-tuned FLAN-T5 generates fresh, role-specific questions every session.'],
  ['📊', 'Communication Analysis', 'librosa measures your pace, pauses, filler words, and voice energy.'],
  ['🎯', 'Skill Gap Detection', "Upload your resume + job description. We find exactly what's missing."],
  ['📈', 'Performance Dashboard', 'Radar charts, score history, and trend lines across every session.'],
  ['🔒', '100% Offline AI', 'No OpenAI. No API keys. Everything runs locally on your machine.'],
];

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <h2 className="text-center font-[var(--font-heading)] text-3xl text-white md:text-4xl">Everything you need to ace your next interview</h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([icon, title, body], i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="h-full p-5 transition hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(108,99,255,0.25)]">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6C63FF]/20">{icon}</div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-300">{body}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
