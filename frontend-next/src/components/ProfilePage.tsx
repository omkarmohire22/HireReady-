'use client';
import React from 'react';
import { CheckCircle, Zap, Award, Mic, Star, Target, Trophy, Flame, Lightbulb, Rocket, Medal } from 'lucide-react';
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
      <div style={{ textAlign: 'center' }}><div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: size * 0.22, color }}>{value}</div></div>
    </div>
  );
};

export default function ProfilePage() {
  const skills = [
    { name: 'React / Frontend', val: 85, color: C.accent },
    { name: 'System Design',    val: 52, color: C.warning },
    { name: 'Communication',   val: 78, color: C.success },
    { name: 'Data Structures', val: 70, color: C.primary },
    { name: 'API Design',      val: 65, color: '#F472B6' },
    { name: 'Behavioral',      val: 82, color: '#A3E635' },
  ];

  const badges = [
    { Icon: Target,    label: 'First Interview', unlocked: true,  color: '#3B82F6' },
    { Icon: Medal,     label: '5 Sessions',      unlocked: true,  color: '#8B5CF6' },
    { Icon: Trophy,    label: '80%+ Score',      unlocked: true,  color: '#F59E0B' },
    { Icon: Flame,     label: '7-Day Streak',    unlocked: false, color: '#EF4444' },
    { Icon: Lightbulb, label: 'Perfect Answer',  unlocked: false, color: '#10B981' },
    { Icon: Rocket,    label: '100 Sessions',    unlocked: false, color: '#EC4899' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Profile Header */}
      <div className="card fade-up p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-5">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff' }}>O</div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: C.success, border: '2px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={11} color="#fff" />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }} className="text-2xl">Omkar</h2>
              <span style={{ background: `${C.primary}18`, color: C.primary, border: `1px solid ${C.primary}33`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>PRO MEMBER</span>
            </div>
            <div style={{ fontSize: 14, color: C.primary, marginBottom: 4 }}>omkar@example.com</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>MCA Final Year Student · Pursuing <strong>Full Stack Engineering</strong></div>
            <div className="flex gap-3 mt-4 flex-wrap">
              {[
                { icon: Mic,  val: '4',      label: 'Sessions' },
                { icon: Star, val: '85%',    label: 'Best Score' },
                { icon: Zap,  val: '4 days', label: 'Streak' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--elevated)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <stat.icon size={14} color={C.primary} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{stat.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 md:mt-0 mt-4">
            <button className="btn-primary" style={{ padding: '10px 18px', fontSize: 14 }}>Edit Profile</button>
          </div>
        </div>
      </div>

      {/* Skill Circles */}
      <div className="fade-up-1 grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Technical Proficiency', val: 71, color: C.accent, sub: 'Average across all technical rounds' },
          { label: 'Communication Clarity', val: 75, color: C.primary, sub: 'Speaking pace & filler word score' },
          { label: 'Overall Readiness',     val: 75, color: C.success, sub: 'Current HireReady score average' },
        ].map(s => (
          <div key={s.label} className="card p-7 text-center">
            <CircleProgress value={s.val} size={100} color={s.color} />
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginTop: 16, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="card fade-up-2 p-6 mb-6">
        <div className="flex justify-between items-center mb-5">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }} className="flex items-center gap-2"><Award size={18} color={C.warning} /> Achievements</h3>
          <span style={{ background: `${C.success}18`, color: C.success, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>3 of 6 unlocked</span>
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
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>Skill Proficiency</h3>
          <Link href="/roadmap" style={{ color: C.primary, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Improve →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-8">
          {skills.map(s => (
            <div key={s.name}>
              <div className="flex justify-between mb-1.5">
                <span style={{ fontSize: 13 }}>{s.name}</span><span style={{ fontSize: 13, color: s.color, fontWeight: 600 }}>{s.val}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--elevated)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${s.val}%`, borderRadius: 2, background: s.color, boxShadow: `0 0 8px ${s.color}66` }} /></div>
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
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}>
              {link.l}
            </Link>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button className="fade-up-5" style={{
        width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
        background: 'transparent', border: '1px dashed rgba(255,77,106,0.35)',
        color: '#FF4D6A', cursor: 'pointer', transition: 'background 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,106,0.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
        Sign Out Securely
      </button>
    </div>
  );
}
