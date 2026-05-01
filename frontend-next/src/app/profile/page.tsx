'use client';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, Zap, Award, Mic, Star } from 'lucide-react';
import Link from 'next/link';

const C = {
  primary: '#6C47FF',
  accent:  '#00E5FF',
  success: '#00D97E',
  warning: '#FFB547',
  primaryGlow: 'rgba(108,71,255,0.35)',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

const CircleProgress = ({ value, size = 100, strokeWidth = 7, color = C.primary }: { value: number; size?: number; strokeWidth?: number; color?: string }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color}66)` }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: size * 0.22, color }}>{value}</div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };
  const MotionLink = motion(Link);
  const skills = [
    { name: 'React / Frontend', val: 85, color: C.accent },
    { name: 'System Design',    val: 52, color: C.warning },
    { name: 'Communication',   val: 78, color: C.success },
    { name: 'Data Structures', val: 70, color: C.primary },
    { name: 'API Design',      val: 65, color: '#F472B6' },
    { name: 'Behavioral',      val: 82, color: '#A3E635' },
  ];

  const badges = [
    { icon: '🎯', label: 'First Interview', unlocked: true },
    { icon: '⭐', label: '5 Sessions',      unlocked: true },
    { icon: '🏆', label: '80%+ Score',      unlocked: true },
    { icon: '🔥', label: '7-Day Streak',    unlocked: false },
    { icon: '💡', label: 'Perfect Answer',  unlocked: false },
    { icon: '🚀', label: '100 Sessions',    unlocked: false },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Profile Header */}
      <div className="card fade-up" data-aos="fade-up" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff' }}>O</div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: C.success, border: '2px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={11} color="#fff" />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>Omkar</h2>
              <span style={{ background: `${C.primary}18`, color: C.primary, border: `1px solid ${C.primary}33`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                PRO MEMBER
              </span>
            </div>
            <div style={{ fontSize: 14, color: C.primary, marginBottom: 4 }}>omkar@example.com</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>MCA Final Year Student · Pursuing <strong>Full Stack Engineering</strong></div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button className="btn-primary" style={{ padding: '10px 18px', fontSize: 14 }}>Edit Profile</button>
          </div>
        </div>
      </div>

      {/* Skill Circles */}
      <div className="fade-up-1" data-aos="fade-up" data-aos-delay={80} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Technical Proficiency', val: 71, color: C.accent,   sub: 'Average across all technical rounds' },
          { label: 'Communication Clarity', val: 75, color: C.primary,  sub: 'Speaking pace & filler word score' },
          { label: 'Overall Readiness',     val: 75, color: C.success,  sub: 'Current HireReady score average' },
        ].map(s => (
          <motion.div
            key={s.label}
            className="card"
            style={{ padding: 28, textAlign: 'center' }}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          >
            <CircleProgress value={s.val} size={100} color={s.color} />
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginTop: 16, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <div className="card fade-up-2" data-aos="fade-up" data-aos-delay={120} style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color={C.warning} /> Achievements
          </h3>
          <span style={{ background: `${C.success}18`, color: C.success, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>3 of 6 unlocked</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {badges.map(a => (
            <motion.div
              key={a.label}
              style={{
              background: a.unlocked ? `${C.warning}15` : 'var(--elevated)',
              border: `1px solid ${a.unlocked ? C.warning + '44' : 'var(--border)'}`,
              borderRadius: 12, padding: '14px 20px', textAlign: 'center',
              opacity: a.unlocked ? 1 : 0.5, minWidth: 90,
            }}
              whileHover={hoverLift}
              whileTap={tapDown}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: a.unlocked ? 'var(--text)' : 'var(--text-muted)' }}>{a.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="card fade-up-3" data-aos="fade-up" data-aos-delay={160} style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>Skill Proficiency</h3>
          <Link href="/roadmap" style={{ color: C.primary, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Improve →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px' }}>
          {skills.map(s => (
            <div key={s.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{s.name}</span>
                <span style={{ fontSize: 13, color: s.color, fontWeight: 600 }}>{s.val}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--elevated)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.val}%`, borderRadius: 2, background: s.color, boxShadow: `0 0 8px ${s.color}66` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="card fade-up-4" data-aos="fade-up" data-aos-delay={200} style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 16 }}>Quick Access</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { l: 'Practice', to: '/practice', c: C.accent   },
            { l: 'Roadmap',  to: '/roadmap',  c: '#A78BFA'  },
            { l: 'Reports',  to: '/report',   c: C.success  },
            { l: 'Settings', to: '/settings', c: C.warning  },
          ].map(link => (
            <MotionLink key={link.l} href={link.to} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'var(--elevated)', border: '1px solid var(--border)',
              color: link.c, textDecoration: 'none', transition: 'all 0.15s',
            }}
              whileHover={hoverLift}
              whileTap={tapDown}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              {link.l}
            </MotionLink>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <motion.button className="fade-up-5" data-aos="fade-up" data-aos-delay={240} style={{
        width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
        background: 'transparent', border: '1px dashed rgba(255,77,106,0.35)',
        color: '#FF4D6A', cursor: 'pointer', transition: 'background 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,106,0.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
        Sign Out Securely
      </motion.button>
    </div>
  );
}
