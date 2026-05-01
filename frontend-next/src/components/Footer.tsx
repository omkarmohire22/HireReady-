import { Github, Linkedin, Mic } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 pb-8 pt-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-3 font-[var(--font-heading)] text-xl font-bold">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-[#6C47FF] p-1.5">
              <img src="/logo.png" alt="HireReady" className="h-full w-full object-contain brightness-0 invert" />
            </div>
            HireReady
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">AI-powered voice interview preparation platform for the next generation of developers.</p>
        </div>
        {['Product', 'Resources', 'Connect'].map((col) => (
          <div key={col}>
            <p className="text-sm font-semibold">{col}</p>
            <div className="mt-2 space-y-2 text-sm text-slate-400">
              <a href="#" className="block">Overview</a>
              <a href="#" className="block">Docs</a>
              <a href="#" className="block">Pricing</a>
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl items-center justify-between border-t border-white/10 px-5 pt-5 text-xs text-slate-500 md:px-8">
        <span>© 2025 HireReady. Built for MCA Final Year.</span>
        <div className="flex items-center gap-3"><Github size={15} /><Linkedin size={15} /></div>
      </div>
    </footer>
  );
}
