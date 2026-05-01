'use client';

import Button from '@/components/ui/Button';

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <div className="gradient-loop rounded-2xl border border-white/10 bg-gradient-to-r from-[#6C63FF] via-[#4f7cff] to-[#00D4AA] p-10 text-center">
        <h3 className="font-[var(--font-heading)] text-3xl text-white">Your next interview starts today.</h3>
        <p className="mt-2 text-slate-100/85">Join students who are already practicing smarter.</p>
        <Button className="mt-6 bg-white text-slate-900 hover:shadow-[0_0_22px_rgba(255,255,255,0.3)]">Launch Your Interview →</Button>
      </div>
    </section>
  );
}
