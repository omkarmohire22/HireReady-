import type { Metadata } from 'next';
import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import AuthThemeToggle from '@/components/auth/AuthThemeToggle';

export const metadata: Metadata = {
  title: 'HireReady – Sign In',
  description: 'Sign in or create your HireReady account to start your AI-powered interview prep.',
};

const FEATURES = [
  { emoji: '🎙️', text: 'AI-powered mock interviews' },
  { emoji: '📊', text: 'Skill gap analysis & reports' },
  { emoji: '🗺️', text: 'Personalised learning roadmap' },
  { emoji: '🔥', text: 'Track streaks & progress' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'var(--bg)', color: 'var(--text)',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex" style={{
        width: '44%', flexShrink: 0, flexDirection: 'column',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '48px 40px',
        justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,71,255,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-60px',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top: Logo */}
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <div className="brand-icon" style={{ overflow: 'hidden' }}>
              <img src="/logo.png" alt="HireReady" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <span className="brand-name">HireReady</span>
              <span className="brand-tag">AI Interview Coach</span>
            </div>
          </Link>

          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32,
            color: 'var(--text)', lineHeight: 1.2, marginBottom: 16,
          }}>
            Ace your next<br />
            <span style={{
              background: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              technical interview
            </span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 36 }}>
            Practice with AI, get instant feedback, close skill gaps — and land the role you deserve.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {f.emoji}
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
          padding: 20, borderRadius: 16,
          background: 'rgba(108,71,255,0.06)',
          border: '1px solid rgba(108,71,255,0.15)',
        }}>
          {[
            { value: '12K+', label: 'Active Users' },
            { value: '94%',  label: 'Offer Rate'  },
            { value: '50+',  label: 'Companies'   },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
                background: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflowY: 'auto', minHeight: '100vh',
      }}>
        {/* Mobile logo */}
        <div className="flex lg:hidden" style={{ padding: '20px 24px', alignItems: 'center', gap: 10 }}>
          <div className="brand-icon" style={{ width: 32, height: 32, borderRadius: 8 }}>
            <BrainCircuit size={16} color="#fff" />
          </div>
          <span className="brand-name" style={{ fontSize: 16 }}>HireReady</span>
        </div>

        {/* Theme Toggle */}
        <AuthThemeToggle />

        {/* Form area */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px 48px',
        }}>
          <div style={{ width: '100%', maxWidth: 440 }}>
            {children}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-subtle)', padding: '0 24px 24px' }}>
          By continuing, you agree to HireReady&apos;s{' '}
          <Link href="#" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Terms</Link>
          {' & '}
          <Link href="#" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
