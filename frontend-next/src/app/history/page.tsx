'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Filter, Search, ChevronRight, Calendar, Clock, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const C = {
  teal:   '#1D9E75',
  purple: '#7F77DD',
  amber:  '#F59E0B',
  error:  '#E5484D',
};

interface SessionRow {
  session_id: number;
  role: string;
  session_type: string;
  difficulty: string;
  status: string;
  date: string;
  ago: string;
  duration: string;
  score: number | null;
  tech_score: number | null;
  comm_score: number | null;
  has_report: boolean;
  questions_answered: number;
}

const ScorePill = ({ score }: { score: number | null }) => {
  if (score === null || score === undefined)
    return <span style={{ color: 'var(--text-subtle)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>—</span>;
  const color = score >= 80 ? C.teal : score >= 60 ? C.amber : C.error;
  return (
    <span className="score-pill" style={{ background: `${color}18`, color, border: `1px solid ${color}28`, fontVariantNumeric: 'tabular-nums' }}>
      {score}%
    </span>
  );
};

const diffBadge = (d: string) => {
  const cls = d === 'Easy' ? 'badge-easy' : d === 'Medium' ? 'badge-medium' : 'badge-hard';
  return <span className={`score-pill ${cls}`}>{d}</span>;
};

const typeBadge = (t: string) => {
  const label = t === 'technical' ? 'Technical' : t === 'behavioural' ? 'Behavioural' : t === 'system_design' ? 'System Design' : t;
  const color = label === 'Technical' ? C.purple : label === 'Behavioural' ? C.teal : C.amber;
  return <span className="score-pill" style={{ background: `${color}12`, color, border: `1px solid ${color}22`, fontSize: 11 }}>{label}</span>;
};

const ROLES = ['All Roles', 'Frontend Developer', 'Backend Engineer', 'Full Stack Dev', 'System Design', 'ML Engineer', 'DevOps Engineer'];
const TYPES = ['All Types', 'technical', 'behavioural', 'system_design'];
const TYPE_LABELS: Record<string, string> = { 'All Types': 'All Types', technical: 'Technical', behavioural: 'Behavioural', system_design: 'System Design' };
const DIFFS = ['All Levels', 'Easy', 'Medium', 'Hard'];

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  background: 'var(--elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-med)',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

export default function HistoryPage() {
  const [sessions, setSessions]     = useState<SessionRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [diffFilter, setDiffFilter] = useState('All Levels');

  useEffect(() => {
    setLoading(true);
    api.getAllSessions()
      .then((data: SessionRow[]) => setSessions(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.role.toLowerCase().includes(q);
    const matchRole = roleFilter === 'All Roles' || s.role === roleFilter;
    const matchType = typeFilter === 'All Types' || s.session_type === typeFilter;
    const matchDiff = diffFilter === 'All Levels' || s.difficulty === diffFilter;
    return matchSearch && matchRole && matchType && matchDiff;
  });

  const scores = filtered.map(s => s.score).filter((v): v is number => v !== null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, v) => a + v, 0) / scores.length) : 0;
  const best     = scores.length ? Math.max(...scores) : 0;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6, fontWeight: 600 }}>Your Activity</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 4 }}>
            Session History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Review all your past mock interview sessions.</p>
        </div>
        <Link href="/practice" className="btn-primary fade-up-1">+ New Session</Link>
      </div>

      {/* Quick Stats */}
      <div className="fade-up-1 grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Sessions', val: filtered.length,              color: C.teal,   cls: 'stat-card-teal',   Icon: Play },
          { label: 'Average Score',  val: avgScore ? `${avgScore}%` : '—', color: C.purple, cls: 'stat-card-purple', Icon: TrendingUp },
          { label: 'Best Score',     val: best ? `${best}%` : '—',     color: C.amber,  cls: 'stat-card-amber',  Icon: Calendar },
        ].map(s => (
          <motion.div
            key={s.label}
            className={`card p-5 ${s.cls}`}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="metric-label">{s.label}</span>
              <s.Icon size={13} color={s.color} />
            </div>
            <div className="metric-num" style={{ color: 'var(--text)' }}>{s.val}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card fade-up-2 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search role…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, width: '100%', paddingLeft: 30, boxSizing: 'border-box' }}
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
          </select>
          <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)} style={selectStyle}>
            {DIFFS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Session list */}
      <div className="card fade-up-3">
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 80px 80px 72px 32px', gap: 8, padding: '10px 20px', borderBottom: '0.5px solid var(--border)' }}>
          {['Role', 'Type / Level', 'Tech', 'Comm', 'Score', ''].map(h => (
            <span key={h} className="metric-label" style={{ display: h === '' ? 'none' : undefined }}>{h}</span>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={28} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14 }}>Loading session history…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: C.error }}>
            <AlertCircle size={28} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Could not load sessions</p>
            <p style={{ fontSize: 13, opacity: 0.7 }}>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Filter size={32} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {sessions.length === 0 ? 'No sessions yet.' : 'No sessions match your filters.'}
            </p>
            <p style={{ fontSize: 13 }}>
              {sessions.length === 0
                ? <Link href="/practice" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Start your first interview →</Link>
                : 'Try adjusting the search or filters above.'}
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && !error && filtered.map((s) => (
          <div
            key={s.session_id}
            className="data-row"
            style={{ display: 'grid', gridTemplateColumns: '1fr 140px 80px 80px 72px 32px', gap: 8, padding: '13px 20px', alignItems: 'center', cursor: 'pointer' }}
          >
            {/* Role */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.teal}12`, border: `1px solid ${C.teal}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Play size={11} color={C.teal} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', marginBottom: 2 }}>{s.role}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={10} />{s.date || s.ago}
                    <span>·</span>
                    <Clock size={10} />{s.duration}
                    {s.questions_answered > 0 && (
                      <><span>·</span>{s.questions_answered}Q</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Type + Diff */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {typeBadge(s.session_type)}
              {diffBadge(s.difficulty)}
            </div>

            {/* Tech */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-med)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
              {s.tech_score !== null ? `${s.tech_score}%` : '—'}
            </div>

            {/* Comm */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-med)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
              {s.comm_score !== null ? `${s.comm_score}%` : '—'}
            </div>

            {/* Score */}
            <div style={{ textAlign: 'right' }}>
              <ScorePill score={s.score} />
            </div>

            {/* Arrow — only if report exists */}
            {s.has_report ? (
              <Link href={`/report/${s.session_id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', width: 26, height: 26, borderRadius: 6, background: 'var(--elevated)' }}>
                <ChevronRight size={13} />
              </Link>
            ) : (
              <div style={{ width: 26, height: 26 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
