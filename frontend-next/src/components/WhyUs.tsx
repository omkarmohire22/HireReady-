import { CheckCircle2 } from 'lucide-react';

const checks = [
  'Real voice simulation - hear + speak, not just type',
  'Communication scored separately from technical content',
  'FLAN-T5 generates unique questions every time',
  'Works fully offline - your data stays private',
  '9 ML models working together, built from scratch',
];

export default function WhyUs() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-2 md:px-8">
      <div>
        <h2 className="font-[var(--font-heading)] text-3xl md:text-4xl">Built different. Not just another chatbot.</h2>
        <p className="mt-4 text-slate-300">HireReady combines voice simulation, offline AI models, and communication analytics to replicate real interview pressure and improve outcomes faster.</p>
      </div>
      <div className="glass-card space-y-3 p-6">
        {checks.map((item) => (
          <p key={item} className="flex items-start gap-2 text-sm text-slate-200"><CheckCircle2 size={16} className="mt-0.5 text-[#00D4AA]" />{item}</p>
        ))}
      </div>
    </section>
  );
}
