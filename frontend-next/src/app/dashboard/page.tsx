'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, ChevronRight, Zap, Loader2, AlertTriangle, TrendingUp, Clock, Mic } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

const C = {
  teal:   '#1D9E75',
  purple: '#7F77DD',
  amber:  '#F59E0B',
  error:  '#E5484D',
  grad:   'linear-gradient(135deg, #6C47FF, #1D9E75)',
};

/* ── Sparkline with cubic bezier + area fill ── */
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const w = 88, h = 36;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  // Cubic bezier smooth path
  const d = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, '');
  const areaD = `${d} L ${pts[pts.length-1].x},${h} L ${pts[0].x},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`fill-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#fill-${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ── Skeleton shimmer ── */
const Sk = ({ w = '100%', h = 16 }: { w?: string | number; h?: number }) => (
  <div className="skeleton" style={{ width: w, height: h }} />
);

/* ── Score pill ── */
const ScorePill = ({ score }: { score: number }) => {
  if (!score) return <span style={{ color: 'var(--text-subtle)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>—</span>;
  const color = score >= 80 ? C.teal : score >= 60 ? C.amber : C.error;
  return (
    <span className="score-pill" style={{ background: `${color}18`, color, border: `1px solid ${color}28`, fontVariantNumeric: 'tabular-nums' }}>
      {score}%
    </span>
  );
};

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

const diffBadge = (d: string) => {
  const cls = d === 'Easy' ? 'badge-easy' : d === 'Medium' ? 'badge-medium' : 'badge-hard';
  return <span className={`score-pill ${cls}`}>{d}</span>;
};

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const lift = reduceMotion ? undefined : { y: -2 };
  const tap  = reduceMotion ? undefined : { scale: 0.99 };

  const user = useAuthStore(s => s.user);
  const [stats, setStats]       = useState<DashStats | null>(null);
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { api } = await import('@/lib/api');
        const [s, r, p] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentSessions(),
          api.getUserProgress()
        ]);
        if (!cancelled) {
          setStats(s);
          setSessions(r);
          setProgress(p);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const interviewData = progress.length > 0 ? progress.map(p => p.session_number) : [0];
  const scoreData = progress.length > 0 ? progress.map(p => p.overall_score) : [0];
  const wpmData = progress.length > 0 ? progress.map(p => p.avg_wpm) : [0];

  const statCards = stats ? [
    {
      label: 'Mock Interviews', val: String(stats.total_sessions),
      sub: 'Total sessions', data: interviewData.length >= 2 ? interviewData : [0, ...interviewData],
      color: C.teal, cls: 'stat-card-teal', Icon: Mic,
    },
    {
      label: 'Average Score', val: stats.average_score ? `${stats.average_score}%` : '—',
      sub: stats.improvement_trend || 'Keep going', data: scoreData.length >= 2 ? scoreData : [0, ...scoreData],
      color: C.purple, cls: 'stat-card-purple', Icon: TrendingUp,
    },
    {
      label: 'Speaking Pace', val: progress.length > 0 && progress[progress.length-1].avg_wpm ? `${Math.round(progress[progress.length-1].avg_wpm)} WPM` : '—',
      sub: 'Conversational pace', data: wpmData.length >= 2 ? wpmData : [0, ...wpmData],
      color: C.amber, cls: 'stat-card-amber', Icon: Clock,
    },
  ] : [];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* ── Header ── */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6, fontWeight: 600 }}>Dashboard</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 4, lineHeight: 1.2 }}>
            Welcome back,{' '}
            <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {user?.name?.split(' ')[0] ?? 'there'}
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Ready to ace your next big interview?</p>
        </div>
        <Link href="/practice" className="btn-primary fade-up-1">
          + Start New Session
        </Link>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: `${C.error}12`, border: `1px solid ${C.error}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: C.error }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="fade-up-2 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading
          ? [C.teal, C.purple, C.amber].map((c, i) => (
              <div key={i} className={`card p-5`} style={{ borderTop: `2px solid ${c}`, borderLeft: `2px solid ${c}` }}>
                <Sk w="55%" h={11} />
                <div style={{ marginTop: 18, marginBottom: 14 }}><Sk w="45%" h={36} /></div>
                <Sk w={88} h={36} />
              </div>
            ))
          : statCards.map(s => (
              <motion.div
                key={s.label}
                className={`card p-5 ${s.cls}`}
                whileHover={lift}
                whileTap={tap}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="metric-label">{s.label}</span>
                  <s.Icon size={14} color={s.color} />
                </div>
                <div className="metric-num" style={{ color: 'var(--text)', marginBottom: 14 }}>{s.val}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Sparkline data={s.data} color={s.color} />
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 500 }}>{s.sub}</span>
                </div>
              </motion.div>
            ))
        }
      </div>

      {/* ── Lower grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* Recent interviews */}
        <div className="card fade-up-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>Recent Interviews</h3>
            <Link href="/history" style={{ fontSize: 12.5, color: 'var(--teal)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            [0,1,2].map(i => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 20px', borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none', alignItems: 'center' }}>
                <Sk w={36} h={36} />
                <div style={{ flex: 1 }}><Sk w="55%" h={13} /></div>
                <Sk w={48} h={22} />
              </div>
            ))
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13.5 }}>
              No sessions yet —{' '}
              <Link href="/practice" style={{ color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>start your first!</Link>
            </div>
          ) : (
            sessions.map((s, i) => (
              <motion.div
                key={s.session_id}
                className="data-row"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px' }}
                whileHover={{ backgroundColor: 'var(--elevated)' }}
                transition={{ duration: 0.1 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.teal}12`, border: `1px solid ${C.teal}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Play size={12} color={C.teal} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.role}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    {diffBadge(s.difficulty)}
                    <span style={{ color: 'var(--text-subtle)' }}>·</span>
                    <span style={{ color: 'var(--text-subtle)' }}>{s.ago}</span>
                  </div>
                </div>
                <div className="hidden sm:flex" style={{ gap: 16, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="metric-label" style={{ marginBottom: 1 }}>Tech</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-med)', fontVariantNumeric: 'tabular-nums' }}>{s.tech_score ? `${s.tech_score}%` : '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="metric-label" style={{ marginBottom: 1 }}>Comm</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-med)', fontVariantNumeric: 'tabular-nums' }}>{s.comm_score ? `${s.comm_score}%` : '—'}</div>
                  </div>
                </div>
                <ScorePill score={s.score} />
                <Link href={`/report/${s.session_id}`} style={{ color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: 'var(--elevated)', flexShrink: 0 }}>
                  <ChevronRight size={14} />
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Upgrade card */}
        <div className="fade-up-5">
          <div className="upgrade-card">
            <div className="upgrade-card-inner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={13} color="#fff" fill="#fff" />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.02em' }}>Upgrade to Pro</span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                Unlock unlimited real-time AI feedback and advanced analytics.
              </p>
              <Link href="/upgrade" style={{ textDecoration: 'none', display: 'block' }}>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: 13.5 }}>
                  Upgrade Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
