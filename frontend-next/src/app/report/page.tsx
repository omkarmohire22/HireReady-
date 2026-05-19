'use client';
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Award, Compass, Play, Loader2, AlertCircle, Calendar, Star, ShieldAlert, BarChart3, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const C = {
  primary: 'var(--teal)',
  accent:  'var(--purple)',
  success: 'var(--teal)',
  warning: 'var(--amber)',
  error:   '#FF4D6A',
  cardBg:  'var(--card-bg)',
  elevated: 'var(--elevated)',
  border:   'var(--border)',
};

const CompactCircleProgress = ({ value, size = 68, strokeWidth = 5, color = C.primary }: { value: number; size?: number; strokeWidth?: number; color?: string }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 4px ${color}55)` }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: size * 0.25, color: 'var(--text-high)' }}>{value}%</div>
      </div>
    </div>
  );
};

export default function ReportsHistoryPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.015 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };
  const MotionLink = motion(Link);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAllSessions();
        setSessions(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch candidate reports history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading candidate reports & sessions history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', background: C.cardBg, maxWidth: 500, margin: '40px auto' }}>
        <AlertCircle size={36} color="var(--error)" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Authentication Required</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{error}</p>
        <button onClick={() => router.push('/auth/login')} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
          Go to Sign In
        </button>
      </div>
    );
  }

  // Stats calculation
  const completedSessions = sessions.filter(s => s.has_report);
  const totalCompleted = completedSessions.length;
  const scores = completedSessions.map(s => s.score).filter((s): s is number => typeof s === 'number');
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  // Find top role practiced
  const roles = sessions.map(s => s.role).filter(r => r && r !== '—');
  const topRole = roles.length > 0 ? roles.reduce((a, b, i, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b) : '—';

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6, fontWeight: 600 }}>Analytics Hub</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 4 }}>Interview Performance History</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Access your historically completed AI-aligned mock sessions, detailed reports, and skills roadmaps.</p>
        </div>
        <Link href="/practice" className="btn" style={{ background: C.grad, border: 'none', color: '#fff', padding: '10px 20px', fontSize: 13.5, fontWeight: 600, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Play size={13} fill="#fff" /> Start Practice Round
        </Link>
      </div>

      {/* Metrics Ribbon */}
      {sessions.length > 0 && (
        <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Sessions Practiced', val: sessions.length, desc: `${totalCompleted} reports compiled`, color: C.accent },
            { label: 'Average Competency Score', val: avgScore > 0 ? `${avgScore}%` : '—', desc: 'Across all evaluated rounds', color: C.primary },
            { label: 'Primary Target Role', val: topRole, desc: 'Most practiced target tier', color: 'var(--amber)' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: 20, borderLeft: `4px solid ${stat.color}` }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-high)', marginBottom: 2 }}>{stat.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{stat.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* History Grid */}
      {sessions.length === 0 ? (
        <div className="card fade-up-2" style={{ padding: '60px 40px', textAlign: 'center', background: C.cardBg }}>
          <Compass size={48} style={{ margin: '0 auto 16px', color: 'var(--text-subtle)', opacity: 0.4 }} />
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Practice Records Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Unlock deep vocal pattern diagnostics, custom 4-week roadmap generation, and technical competency analysis by completing your first mock interview session.
          </p>
          <Link href="/practice" className="btn-primary" style={{ padding: '10px 24px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Play size={13} fill="#fff" /> Start Practice Arena
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sessions.map((s, idx) => {
            const hasReport = s.has_report && s.score !== null;
            const scoreColor = s.score >= 80 ? C.success : s.score >= 60 ? 'var(--amber)' : C.error;
            
            return (
              <motion.div
                key={s.session_id}
                className="card fade-up-2"
                style={{
                  padding: '24px 28px',
                  background: 'var(--card-bg)',
                  border: hasReport ? '1px solid var(--border)' : '1px dashed rgba(255,181,71,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 20
                }}
                whileHover={hoverLift}
                whileTap={tapDown}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, minWidth: 280 }}>
                  {hasReport ? (
                    <CompactCircleProgress value={s.score} color={scoreColor} />
                  ) : (
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,181,71,0.08)', border: '1px dashed rgba(255,181,71,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={28} color="var(--amber)" style={{ animation: 'pulse 2s infinite' }} />
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, margin: 0 }}>{s.role}</h3>
                      <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: s.session_type === 'Technical' ? 'var(--teal-dim)' : 'rgba(108,71,255,0.08)', color: s.session_type === 'Technical' ? 'var(--teal)' : 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {s.session_type || 'Practice'}
                      </span>
                      <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-subtle)', fontWeight: 600 }}>
                        {s.difficulty}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--text-muted)', flexWrap: 'wrap', marginTop: 6 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {s.date || 'Today'} ({s.ago})
                      </span>
                      {s.duration !== '—' && (
                        <span>🕒 Duration: <strong>{s.duration}</strong></span>
                      )}
                      {hasReport && (
                        <span>🎤 Answered: <strong>{s.questions_answered} questions</strong></span>
                      )}
                    </div>
                    
                    {/* Render sub-scores if report exists */}
                    {hasReport && (
                      <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100 }}>
                          <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Technical accuracy</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ height: 4, width: 60, background: 'var(--elevated)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${s.tech_score}%`, background: 'var(--teal)' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{s.tech_score}%</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100 }}>
                          <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Speech clarity</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ height: 4, width: 60, background: 'var(--elevated)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${s.comm_score}%`, background: 'var(--purple)' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{s.comm_score}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {hasReport ? (
                    <>
                      <Link href={`/roadmap/${s.session_id}`} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center', color: 'var(--accent)', borderColor: 'rgba(108,71,255,0.22)' }}>
                        <BookOpen size={13} />
                        4-Week Roadmap
                      </Link>
                      <Link href={`/report/${s.session_id}`} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center' }}>
                        <Award size={13} />
                        View Report
                      </Link>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)', padding: '6px 14px', borderRadius: 8 }}>
                      <ShieldAlert size={14} color="var(--amber)" />
                      <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>Active practice session in progress</span>
                      <Link href="/practice" style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, marginLeft: 6, textDecoration: 'none' }}>
                        Resume →
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
