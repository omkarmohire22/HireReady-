'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, ChevronRight, Zap, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

const C = {
  primary: '#6C47FF',
  accent:  '#00E5FF',
  success: '#00D97E',
  warning: '#FFB547',
  error:   '#FF4D6A',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

const ScorePill = ({ score }: { score: number }) => {
  const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.error;
  return (
    <span style={{ background: `${color}22`, color, borderRadius: 20, padding: '3px 10px', fontSize: 13, fontWeight: 600, border: `1px solid ${color}33` }}>
      {score}%
    </span>
  );
};

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const w = 80, h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Skeleton shimmer block
const Skeleton = ({ w = '100%', h = 20 }: { w?: string | number; h?: number }) => (
  <div style={{ width: w, height: h, borderRadius: 6, background: 'var(--elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
);

interface DashStats {
  total_sessions: number;
  average_score: number;
  improvement_trend: string;
  time_practiced_hours: number;
}

interface RecentSession {
  session_id: string;
  role: string;
  session_type: string;
  difficulty: string;
  ago: string;
  score: number;
  tech_score: number;
  comm_score: number;
}

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const hoverRow  = reduceMotion ? undefined : { y: -1, backgroundColor: 'var(--elevated)' };
  const tapDown   = reduceMotion ? undefined : { scale: 0.99 };

  const user = useAuthStore(s => s.user);

  const [stats, setStats]         = useState<DashStats | null>(null);
  const [sessions, setSessions]   = useState<RecentSession[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { api } = await import('@/lib/api');
        const [statsData, sessionsData] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentSessions(),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setSessions(sessionsData);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Build stat cards from live data
  const statCards = stats ? [
    {
      label: 'Mock Interviews',
      val: String(stats.total_sessions),
      sub: 'Total sessions',
      data: [1,2,3,4,5,6, stats.total_sessions],
      color: C.accent,
    },
    {
      label: 'Average Score',
      val: `${stats.average_score}%`,
      sub: stats.improvement_trend,
      data: [60,62,65,68,70,72, stats.average_score],
      color: C.success,
    },
    {
      label: 'Time Practiced',
      val: `${stats.time_practiced_hours}h`,
      sub: 'Keep it up!',
      data: [1,2,3,4,5,6, stats.time_practiced_hours],
      color: C.primary,
    },
  ] : [];

  const diffColor = (d: string) => d === 'Easy' ? C.success : d === 'Medium' ? C.warning : C.error;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 34, letterSpacing: '-1px', marginBottom: 6 }}>
            Welcome back,{' '}
            <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {user?.name?.split(' ')[0] ?? 'there'}
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Ready to ace your next big interview?</p>
        </div>
        <Link href="/practice" className="btn-primary fade-up-1" style={{ padding: '12px 24px' }}>
          + Start New Session
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: `${C.error}18`, border: `1px solid ${C.error}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: C.error }}>
          ⚠ {error} — showing live data once the backend is reachable.
        </div>
      )}

      {/* Stat Cards */}
      <div className="fade-up-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-9">
        {loading
          ? [C.accent, C.success, C.primary].map((color, i) => (
              <div key={i} className="card p-6" style={{ borderLeft: `4px solid ${color}` }}>
                <Skeleton w="60%" h={14} />
                <div style={{ marginTop: 16, marginBottom: 12 }}><Skeleton w="40%" h={40} /></div>
                <Skeleton w={80} h={32} />
              </div>
            ))
          : statCards.map((s, i) => (
              <motion.div
                key={s.label}
                className="card p-6"
                style={{ borderLeft: `4px solid ${s.color}` }}
                whileHover={hoverLift}
                whileTap={tapDown}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</div>
                  <span style={{ fontSize: 11, color: s.color, background: `${s.color}18`, borderRadius: 20, padding: '3px 8px' }}>{s.sub}</span>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 40, letterSpacing: '-1px', color: s.color, marginBottom: 12 }}>{s.val}</div>
                <Sparkline data={s.data} color={s.color} />
              </motion.div>
            ))
        }
      </div>

      {/* Lower Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Recent Interviews */}
        <div className="card fade-up-3 p-6 overflow-x-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>Recent Interviews</h3>
            <Link href="/history" style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            [0,1,2].map(i => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                <Skeleton w={40} h={40} />
                <div style={{ flex: 1 }}><Skeleton w="60%" h={14} /></div>
                <Skeleton w={60} h={24} />
              </div>
            ))
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No sessions yet —{' '}
              <Link href="/practice" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>start your first!</Link>
            </div>
          ) : (
            sessions.map((s, i) => (
              <motion.div
                key={s.session_id}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}
                whileHover={hoverRow}
                whileTap={tapDown}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.primary}18`, border: `1px solid ${C.primary}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Play size={14} color={C.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.role}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, background: `${diffColor(s.difficulty)}18`, color: diffColor(s.difficulty), border: `1px solid ${diffColor(s.difficulty)}33`, borderRadius: 4, padding: '2px 6px' }}>{s.difficulty}</span>
                    <span>·</span>
                    <span>{s.ago}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>TECH</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.tech_score}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>COMM</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.comm_score}%</div>
                  </div>
                  <ScorePill score={s.score} />
                  <Link href={`/report/${s.session_id}`} style={{ color: 'var(--text-muted)', display: 'flex' }}>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Right Column — Upgrade Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.div
            className="card fade-up-5"
            style={{ padding: 24, background: `linear-gradient(135deg, ${C.primary}18, ${C.accent}0A)`, border: `1px solid ${C.primary}33` }}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>Upgrade to Pro</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              Unlock unlimited real-time AI feedback and advanced analytics.
            </p>
            <motion.button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 14 }}
              whileHover={hoverLift}
              whileTap={tapDown}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              Upgrade Now
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

