'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Play, Brain, Mic, BarChart2, BookOpen, Shield, Star, Target, Clock, Zap, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

const C = {
  primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E',
  primaryGlow: 'rgba(108,71,255,0.4)', accentGlow: 'rgba(0,229,255,0.3)',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

const WaveBar = ({ active, height, delay }: { active: boolean; height: number; delay: number }) => (
  <div className="w-[3px] rounded-full shrink-0 origin-bottom" style={{
    height,
    background: active ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : 'rgba(108,71,255,0.2)',
    boxShadow: active ? `0 0 10px ${C.primaryGlow}` : 'none',
    animation: active ? `waveBar 0.8s ${delay}s ease-in-out infinite` : 'none',
  }} />
);

export default function Home() {
  const { isDark, toggle } = useTheme();
  const rootRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const heroItems = gsap.utils.toArray<HTMLElement>('.gsap-hero-item');
      if (heroItems.length) {
        gsap.set(heroItems, { opacity: 0, y: 24 });
        gsap.to(heroItems, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
        });
      }

      const heroCard = gsap.utils.toArray<HTMLElement>('.gsap-hero-card');
      if (heroCard.length) {
        gsap.set(heroCard, { opacity: 0, y: 28, rotateX: 8, rotateY: -6, transformPerspective: 1000 });
        gsap.to(heroCard, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          duration: 1,
          ease: 'power3.out',
          delay: 0.15,
        });
      }

      gsap.utils.toArray<HTMLElement>('.gsap-section').forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 26,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 78%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('.gsap-card').forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 18,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      const cta = document.querySelector('.gsap-cta');
      if (cta) {
        gsap.from(cta, {
          opacity: 0,
          scale: 0.98,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cta,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      gsap.utils.toArray<HTMLElement>('.gsap-glow').forEach((glow, i) => {
        gsap.to(glow, {
          y: i % 2 === 0 ? 40 : -30,
          ease: 'none',
          scrollTrigger: {
            trigger: glow,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { num: '3K+', label: 'Questions', icon: Brain },
    { num: '95%', label: 'Satisfaction', icon: Star },
    { num: '12+', label: 'Categories', icon: Target },
    { num: '10m', label: 'Setup Time', icon: Clock },
  ];

  const features = [
    { icon: Mic, title: 'Voice AI Scoring', desc: 'Real-time analysis of your speech using advanced neural models.' },
    { icon: BarChart2, title: 'Predictive Analytics', desc: 'ML-powered score prediction matching top hiring loops.' },
    { icon: BookOpen, title: 'Personalized Roadmap', desc: 'Custom learning paths generated based on your weak areas.' },
    { icon: Shield, title: 'FAANG Simulated', desc: 'Questions sourced directly from Real Google & Meta interviews.' },
  ];

  const waveData = Array.from({ length: 40 }, (_, i) => ({ height: 12 + Math.abs(Math.sin(i * 0.8)) * 34, active: i > 8 && i < 32 }));

  return (
    <main ref={rootRef} className="min-h-screen bg-[var(--bg-base)] text-[var(--text-high)] font-sans overflow-hidden selection:bg-[#6C47FF]/30">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(var(--text-high) 1px, transparent 1px), linear-gradient(90deg, var(--text-high) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* ── HEADER ── */}
      <header className="absolute top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(108,71,255,0.3)]" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.accent})` }}>
            <Brain size={20} color="#fff" />
          </div>
          <span className="font-['Syne'] font-bold text-xl tracking-tight">HireReady</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={toggle} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--elevated)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-high)]" title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/auth/login" className="hidden sm:block text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-high)] transition-colors">Log In</Link>
          <Link href="/auth/register" className="btn-primary py-2.5 px-6 text-sm">Get Started</Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12 px-6 lg:px-12">
        {/* Ambient Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gsap-glow absolute top-[10%] left-[10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 mix-blend-screen" style={{ background: C.primaryGlow, animation: 'blobMove1 15s ease-in-out infinite' }} />
          <div className="gsap-glow absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 mix-blend-screen" style={{ background: C.accentGlow, animation: 'blobMove2 18s ease-in-out infinite' }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className="z-10 text-center lg:text-left pt-12 lg:pt-0">
            <div className="gsap-hero-item inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border border-[#6C47FF]/20 bg-[#6C47FF]/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]"></span>
              </span>
              <span className="text-xs font-semibold text-[#00E5FF] tracking-wide uppercase">AI-Powered Prep · Now Live</span>
            </div>

            <h1 className="gsap-hero-item font-['Syne'] font-extrabold text-[clamp(48px,6vw,84px)] leading-[1.05] tracking-tight mb-6">
              Crack Your Next <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${C.primary}, #A78BFA, ${C.accent})` }}>Dream Interview</span>
            </h1>

            <p className="gsap-hero-item text-lg md:text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Stop guessing. Practice with state-of-the-art AI, get real-time voice scoring, and land offers at top engineering companies.
            </p>

            <div className="gsap-hero-item flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/auth/register" className="btn-primary py-4 px-8 text-base shadow-[0_0_30px_rgba(108,71,255,0.4)] hover:scale-105 transition-transform">
                Start Free Interview <ArrowRight size={18} className="ml-2" />
              </Link>
              <Link href="/practice" className="btn-ghost py-4 px-8 text-base bg-[var(--elevated)] hover:bg-[var(--border)] border border-[var(--border)]">
                Watch Demo <Play size={18} className="ml-2" />
              </Link>
            </div>
            
            <div className="gsap-hero-item flex items-center justify-center lg:justify-start gap-3 mt-8 text-sm text-[var(--text-subtle)] font-medium">
              <CheckCircle2 size={16} color={C.success} /> No credit card required 
              <span className="opacity-40">•</span>
              <CheckCircle2 size={16} color={C.success} /> Instant access
            </div>
          </div>

          {/* Right Mock UI Showcase */}
          <div className="gsap-hero-card relative w-full max-w-[600px] mx-auto lg:ml-auto z-10 perspective-[1000px]">
             <div className="relative bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0">
                
                {/* Mac Toolbar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--elevated)]">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="font-['Syne'] font-bold text-lg mb-1">Frontend Developer Loop</div>
                      <div className="text-[var(--text-muted)] text-xs">Google (Simulated) · Round 1</div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#00D97E]/10 border border-[#00D97E]/20 rounded-full px-3 py-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#00D97E] animate-pulse" />
                      <span className="text-xs font-bold text-[#00D97E] uppercase tracking-wider">Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[{ label: 'Overall', val: 94, c: C.success }, { label: 'Technical', val: 88, c: C.primary }, { label: 'Comm', val: 91, c: C.accent }].map(s => (
                      <div key={s.label} className="bg-[var(--elevated)] border border-[var(--border)] rounded-xl p-4 text-center">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2">{s.label}</div>
                        <div className="font-['Syne'] font-bold text-2xl md:text-3xl" style={{ color: s.c }}>{s.val}<span className="text-sm">%</span></div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Real-time Voice Signal</div>
                      <div className="text-[10px] font-bold text-[#00D97E] bg-[#00D97E]/10 px-2 py-0.5 rounded uppercase">Optimal Pace</div>
                    </div>
                    <div className="flex items-end gap-1.5 h-14 w-full">
                      {waveData.map((w, i) => <WaveBar key={i} active={w.active} height={w.height} delay={i * 0.04} />)}
                    </div>
                  </div>

                  <div className="bg-[#6C47FF]/10 border border-[#6C47FF]/30 border-l-4 border-l-[#6C47FF] rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} color="#6C47FF" />
                      <div className="text-[10px] text-[#6C47FF] font-bold uppercase tracking-widest">AI Interviewer</div>
                    </div>
                    <div className="text-sm leading-relaxed italic text-[var(--text-high)]">
                      "Could you explain React's reconciliation algorithm in depth, and specifically how you'd profile and optimize a re-rendering bottleneck?"
                    </div>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="gsap-section relative z-10 -mt-10 max-w-6xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="gsap-card card p-6 md:p-8 text-center bg-[var(--card-bg)]/90 backdrop-blur-md"
            >
              <s.icon size={24} color={C.primary} className="mx-auto mb-4" />
              <div className="font-['Syne'] font-extrabold text-3xl md:text-4xl mb-1">{s.num}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="gsap-section py-24 px-6 max-w-7xl mx-auto border-t border-[var(--border)]">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="font-['Syne'] font-extrabold text-3xl md:text-5xl tracking-tight mb-6">
            Everything you need to <span className="text-transparent bg-clip-text" style={{ backgroundImage: C.grad }}>get hired.</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-2xl mx-auto">
            The most comprehensive AI interview prep platform built exclusively for software engineers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="gsap-card card p-8 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(108,71,255,0.15)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#6C47FF]/10 border border-[#6C47FF]/20 flex items-center justify-center mb-6">
                <f.icon size={22} color={C.primary} />
              </div>
              <div className="font-['Syne'] font-bold text-xl mb-3">{f.title}</div>
              <div className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="gsap-section py-24 px-6">
        <div className="gsap-cta max-w-5xl mx-auto bg-gradient-to-br from-[#6C47FF]/20 to-[#00E5FF]/10 border border-[#6C47FF]/30 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] bg-[#00E5FF]/20 translate-x-1/3 -translate-y-1/3" />
          <div className="relative z-10">
            <h2 className="font-['Syne'] font-extrabold text-4xl md:text-6xl tracking-tight mb-6">
              Ready to crack your next interview?
            </h2>
            <p className="text-[var(--text-muted)] text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of engineers who landed their dream jobs using HireReady's AI-powered feedback loop.
            </p>
            <Link href="/auth/register" className="btn-primary py-5 px-10 text-lg shadow-[0_0_40px_rgba(108,71,255,0.5)] hover:scale-105 transition-transform inline-flex">
              Start Free Interview <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="gsap-section border-t border-[var(--border)] pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C47FF] to-[#00E5FF] flex items-center justify-center">
                <Brain size={20} color="#fff" />
              </div>
              <span className="font-['Syne'] font-bold text-xl">HireReady</span>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-xs">
              Revolutionizing technical interview prep with predictive voice AI and FAANG-grade evaluations.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'How it Works'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Engineering Blog'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
          ].map(col => (
            <div key={col.title}>
              <div className="font-['Syne'] font-bold text-xs uppercase tracking-widest text-[var(--text-muted)] mb-6">{col.title}</div>
              <div className="flex flex-col gap-4">
                {col.links.map(l => (
                  <Link href="#" key={l} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-high)] transition-colors">{l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xs text-[var(--text-subtle)]">© 2026 HireReady Labs Inc. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00D97E] animate-pulse" />
            <span className="text-xs font-semibold text-[#00D97E]">All systems operational</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
