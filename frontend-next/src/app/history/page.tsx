'use client';
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Filter, Search, ChevronRight, Calendar, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const C = {
  primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E',
  warning: '#FFB547', error: '#FF4D6A',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

const ScorePill = ({ score }: { score: number }) => {
  const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.error;
  return (
    <span style={{ background: `${color}22`, color, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700, border: `1px solid ${color}33` }}>
      {score}%
    </span>
  );
};

const ALL_SESSIONS = [
  { id: 1,  role: 'Frontend Developer',   company: 'Google',        date: '2026-03-27', duration: '18 min', tech: 78, comm: 82, score: 85, type: 'Technical',    diff: 'Medium' },
  { id: 2,  role: 'Backend Engineer',     company: 'Amazon',        date: '2026-03-24', duration: '22 min', tech: 70, comm: 68, score: 72, type: 'Technical',    diff: 'Hard' },
  { id: 3,  role: 'Full Stack Dev',       company: 'Startup X',     date: '2026-03-21', duration: '15 min', tech: 60, comm: 71, score: 64, type: 'System Design', diff: 'Medium' },
  { id: 4,  role: 'Frontend Developer',   company: 'Meta',          date: '2026-03-18', duration: '20 min', tech: 82, comm: 76, score: 80, type: 'Behavioural',  diff: 'Easy' },
  { id: 5,  role: 'System Design',        company: 'Netflix',       date: '2026-03-15', duration: '28 min', tech: 55, comm: 60, score: 58, type: 'System Design', diff: 'Hard' },
  { id: 6,  role: 'Full Stack Dev',       company: 'Flipkart',      date: '2026-03-12', duration: '18 min', tech: 74, comm: 80, score: 76, type: 'Technical',    diff: 'Medium' },
  { id: 7,  role: 'Backend Engineer',     company: 'Microsoft',     date: '2026-03-09', duration: '14 min', tech: 88, comm: 72, score: 83, type: 'Technical',    diff: 'Hard' },
  { id: 8,  role: 'Frontend Developer',   company: 'Airbnb',        date: '2026-03-06', duration: '17 min', tech: 66, comm: 74, score: 69, type: 'Behavioural',  diff: 'Medium' },
];

const ROLES = ['All Roles', 'Frontend Developer', 'Backend Engineer', 'Full Stack Dev', 'System Design'];
const TYPES = ['All Types', 'Technical', 'System Design', 'Behavioural'];
const DIFFS = ['All Levels', 'Easy', 'Medium', 'Hard'];

export default function HistoryPage() {
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const hoverRow = reduceMotion ? undefined : { y: -1, backgroundColor: 'var(--elevated)' };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [diffFilter, setDiffFilter] = useState('All Levels');

  const filtered = ALL_SESSIONS.filter(s => {
    const matchSearch = s.role.toLowerCase().includes(search.toLowerCase()) || s.company.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All Roles' || s.role === roleFilter;
    const matchType = typeFilter === 'All Types' || s.type === typeFilter;
    const matchDiff = diffFilter === 'All Levels' || s.diff === diffFilter;
    return matchSearch && matchRole && matchType && matchDiff;
  });

  const avgScore = filtered.length ? Math.round(filtered.reduce((a, s) => a + s.score, 0) / filtered.length) : 0;
  const best = filtered.length ? Math.max(...filtered.map(s => s.score)) : 0;

  const diffColor = (d: string) => d === 'Easy' ? C.success : d === 'Medium' ? C.warning : C.error;
  const typeColor = (t: string) => t === 'Technical' ? C.primary : t === 'Behavioural' ? C.accent : C.warning;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up" data-aos="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Your Activity</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 34, letterSpacing: '-1px', marginBottom: 6 }}>Session History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Review all your past mock interview sessions.</p>
        </div>
        <Link href="/practice" className="btn-primary" style={{ padding: '12px 22px' }}>
          + New Session
        </Link>
      </div>

      {/* Quick stats */}
      <div className="fade-up-1 grid grid-cols-3 gap-4 mb-6" data-aos="fade-up" data-aos-delay={80}>
        {[
          { label: 'Total Sessions', val: filtered.length.toString(), color: C.primary, icon: Play },
          { label: 'Average Score',  val: `${avgScore}%`,            color: C.success, icon: TrendingUp },
          { label: 'Best Score',     val: `${best}%`,                color: C.warning, icon: Calendar },
        ].map(s => (
          <motion.div
            key={s.label}
            className="card p-5"
            style={{ borderLeft: `4px solid ${s.color}` }}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: s.color }}>{s.val}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        className="card fade-up-2 p-5 mb-6"
        data-aos="fade-up"
        data-aos-delay={120}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search role or company…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 34px', borderRadius: 8,
                background: 'var(--elevated)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Role */}
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {/* Type */}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* Difficulty */}
          <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }}>
            {DIFFS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Session list */}
      <div className="card fade-up-3" data-aos="fade-up" data-aos-delay={160}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Filter size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>No sessions match your filters.</p>
            <p style={{ fontSize: 13 }}>Try adjusting your search or filters above.</p>
          </div>
        ) : (
          filtered.map((s, i) => (
            <motion.div
              key={s.id}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
              whileHover={hoverRow}
              whileTap={tapDown}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            >
              {/* Icon */}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.primary}18`, border: `1px solid ${C.primary}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Play size={14} color={C.primary} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.role}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{s.company}</span>
                  <span>·</span>
                  <Calendar size={11} style={{ display: 'inline' }} /> {s.date}
                  <span>·</span>
                  <Clock size={11} style={{ display: 'inline' }} /> {s.duration}
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, background: `${typeColor(s.type)}18`, color: typeColor(s.type), border: `1px solid ${typeColor(s.type)}33`, borderRadius: 6, padding: '3px 8px' }}>
                  {s.type}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, background: `${diffColor(s.diff)}18`, color: diffColor(s.diff), border: `1px solid ${diffColor(s.diff)}33`, borderRadius: 6, padding: '3px 8px' }}>
                  {s.diff}
                </span>
              </div>

              {/* Scores */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'center', display: 'none' }} className="sm:block">
                  <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: 2 }}>Tech</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.tech}%</div>
                </div>
                <div style={{ textAlign: 'center', display: 'none' }} className="sm:block">
                  <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: 2 }}>Comm</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.comm}%</div>
                </div>
                <ScorePill score={s.score} />
                <Link href={`/report/${s.id}`} style={{ color: 'var(--text-muted)', display: 'flex' }}>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
