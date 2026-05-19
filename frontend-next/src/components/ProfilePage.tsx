'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle, Zap, Award, Mic, Star, Target, Trophy, Flame, Lightbulb, Rocket, Medal, Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';

const C = {
  primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E',
  warning: '#FFB547', grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

const CircleProgress = ({ value, size = 100, strokeWidth = 7, color = C.primary }: { value: number; size?: number; strokeWidth?: number; color?: string }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color}66)` }} />
      </svg>
      <div style={{ textAlign: 'center' }}><div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: size * 0.22, color }}>{Math.round(value)}</div></div>
    </div>
  );
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({ total_sessions: 0, average_score: 0, time_practiced_hours: 0, improvement_trend: "+0%" });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [uRes, sRes, rRes] = await Promise.all([
          fetch('/api/auth/me', { headers }),
          fetch('/api/user/dashboard', { headers }),
          fetch('/api/user/sessions/recent', { headers })
        ]);

        if (uRes.ok) setUser(await uRes.json());
        if (sRes.ok) setStats(await sRes.json());
        if (rRes.ok) setRecent(await rRes.json());
      } catch (err) {
        console.warn("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading profile...</p>
      </div>
    );
  }

  // Calculate dynamic skill averages based on recent sessions
  const techAvg = recent.length > 0 ? recent.reduce((sum, r) => sum + (r.tech_score || 0), 0) / recent.length : 0;
  const commAvg = recent.length > 0 ? recent.reduce((sum, r) => sum + (r.comm_score || 0), 0) / recent.length : 0;
  const bestScore = recent.length > 0 ? Math.max(...recent.map(r => r.score || 0)) : 0;

  const skills = [
    { name: 'Technical Accuracy', val: techAvg, color: C.accent },
    { name: 'Communication',      val: commAvg, color: C.success },
    { name: 'Overall Score',      val: stats.average_score, color: C.primary },
  ];

  const badges = [
    { Icon: Target,    label: 'First Interview', unlocked: stats.total_sessions >= 1,  color: '#3B82F6' },
    { Icon: Medal,     label: '5 Sessions',      unlocked: stats.total_sessions >= 5,  color: '#8B5CF6' },
    { Icon: Trophy,    label: '80%+ Score',      unlocked: bestScore >= 80,  color: '#F59E0B' },
    { Icon: Flame,     label: '7-Day Streak',    unlocked: false, color: '#EF4444' },
    { Icon: Lightbulb, label: 'Perfect Answer',  unlocked: false, color: '#10B981' },
    { Icon: Rocket,    label: '100 Sessions',    unlocked: stats.total_sessions >= 100, color: '#EC4899' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Profile Header */}
      <div className="card fade-up p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff' }}>
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: C.success, border: '2px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={11} color="#fff" />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }} className="text-2xl">{user?.full_name || 'HireReady User'}</h2>
              <span style={{ background: `${C.primary}18`, color: C.primary, border: `1px solid ${C.primary}33`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>PRO MEMBER</span>
            </div>
            <div style={{ fontSize: 14, color: C.primary, marginBottom: 4 }}>{user?.email || 'user@example.com'}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Professional Member · <strong>Technical Candidate</strong></div>
            <div className="flex gap-3 mt-4 flex-wrap">
              {[
                { icon: Mic,  val: `${stats.total_sessions}`, label: 'Sessions' },
                { icon: Star, val: `${Math.round(bestScore)}%`, label: 'Best Score' },
                { icon: Zap,  val: `${stats.time_practiced_hours}h`, label: 'Practiced' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--elevated)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <stat.icon size={14} color={C.primary} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{stat.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skill Circles */}
      <div className="fade-up-1 grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Technical Proficiency', val: techAvg, color: C.accent, sub: 'Average across technical rounds' },
          { label: 'Communication Clarity', val: commAvg, color: C.primary, sub: 'Speaking pace & fillers' },
          { label: 'Overall Readiness',     val: stats.average_score, color: C.success, sub: 'Current global score average' },
        ].map(s => (
          <div key={s.label} className="card p-7 flex flex-col items-center justify-center text-center">
            <CircleProgress value={s.val} size={100} color={s.color} />
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginTop: 16, marginBottom: 6, color: 'var(--text)' }}>{s.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="card fade-up-2 p-6 mb-6">
        <div className="flex justify-between items-center mb-5">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)' }} className="flex items-center gap-2"><Award size={18} color={C.warning} /> Achievements</h3>
          <span style={{ background: `${C.success}18`, color: C.success, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
            {badges.filter(b => b.unlocked).length} of {badges.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {badges.map(a => {
            const IconComp = a.Icon;
            return (
              <div key={a.label} style={{ background: a.unlocked ? `${a.color}10` : 'var(--elevated)', border: `1px solid ${a.unlocked ? a.color + '44' : 'var(--border)'}`, borderRadius: 12, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: a.unlocked ? 1 : 0.6, transition: 'transform 0.2s, box-shadow 0.2s', ...(a.unlocked ? { cursor: 'pointer' } : {}) }}
                onMouseEnter={e => { if (a.unlocked) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 16px ${a.color}25`; } }}
                onMouseLeave={e => { if (a.unlocked) { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; } }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: a.unlocked ? `${a.color}20` : 'var(--border)', color: a.unlocked ? a.color : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: a.unlocked ? `inset 0 0 0 1px ${a.color}33` : 'none' }}>
                  <IconComp size={20} strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: a.unlocked ? 'var(--text)' : 'var(--text-muted)' }}>{a.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="card fade-up-3 p-6 mb-6">
        <div className="flex justify-between items-center mb-5">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>Performance Summary</h3>
          <Link href="/roadmap" style={{ color: C.primary, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Improve →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
          {skills.map(s => (
            <div key={s.name}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontSize: 14, color: s.color, fontWeight: 700 }}>{Math.round(s.val)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--elevated)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(s.val)}%`, borderRadius: 3, background: s.color, boxShadow: `0 0 8px ${s.color}66` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="card fade-up-4 p-6 mb-6">
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 16 }}>Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: 'Practice', to: '/practice', c: C.accent   },
            { l: 'Roadmap',  to: '/roadmap',  c: '#A78BFA'  },
            { l: 'Reports',  to: '/report',   c: C.success  },
            { l: 'Settings', to: '/settings', c: C.warning  },
          ].map(link => (
            <Link key={link.l} href={link.to} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'var(--elevated)', border: '1px solid var(--border)',
              color: link.c, textDecoration: 'none', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.borderColor = link.c; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
              {link.l}
            </Link>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button className="fade-up-5 flex items-center justify-center gap-2" style={{
        width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
        background: 'transparent', border: '1px dashed rgba(255,77,106,0.35)',
        color: '#FF4D6A', cursor: 'pointer', transition: 'all 0.2s',
      }}
        onClick={handleSignOut}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,106,0.08)'; (e.currentTarget as HTMLElement).style.borderStyle = 'solid'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderStyle = 'dashed'; }}>
        <LogOut size={16} /> Sign Out Securely
      </button>
    </div>
  );
}
