'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Play, FileText } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  color: string;
  glowClass?: string;
  icon: React.ReactNode;
  delay?: number;
}

export function StatCard({
  label, value, trend, trendUp = true, color, glowClass = '', icon, delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      className={`stat-card ${glowClass} card`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${color}22, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}16`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8,
            fontSize: 11, fontWeight: 700,
            background: trendUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: trendUp ? '#10b981' : '#ef4444',
            border: `1px solid ${trendUp ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}`
          }}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        </div>

        <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-high)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>
          {value}
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-low)' }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
}

interface InterviewCardProps {
  role: string;
  company: string;
  date: string;
  score: number;
  tech: number;
  comm: number;
  delay?: number;
}

const scoreColor = (s: number) =>
  s >= 80 ? 'var(--green)' : s >= 70 ? 'var(--blue)' : s >= 60 ? 'var(--amber)' : 'var(--red)';
const scoreBadgeClass = (s: number) =>
  s >= 80 ? 'badge-green' : s >= 70 ? 'badge-blue' : s >= 60 ? 'badge-amber' : 'badge-red';

export function InterviewCard({ role, company, date, score, tech, comm, delay = 0 }: InterviewCardProps) {
  const companyGrad = company === 'Google' ? 'linear-gradient(135deg, #4285f4, #34a853)' :
                      company === 'Amazon' ? 'linear-gradient(135deg, #ff9900, #e69500)' :
                      company === 'Flipkart' ? 'linear-gradient(135deg, #2874f0, #1a5cc8)' :
                      'linear-gradient(135deg, #4f46e5, #7c3aed)';

  return (
    <motion.div
      className="interview-row group"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#fff', background: companyGrad, flexShrink: 0
        }}>
          {company.charAt(0)}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{role}</p>
          <p style={{ fontSize: 12, color: 'var(--text-med)', marginTop: 2 }}>{company} · {date}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        <div className="hidden sm:flex" style={{ gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p className="section-overline">Tech</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: scoreColor(tech) }}>{tech}%</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="section-overline">Comm</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: scoreColor(comm) }}>{comm}%</p>
          </div>
        </div>

        <div className={`badge ${scoreBadgeClass(score)}`} style={{ fontSize: 15, padding: '4px 10px', fontWeight: 800 }}>
          {score}%
        </div>

        <div className="hidden sm:flex" style={{ gap: 8 }}>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
            <Play size={10} /> Resume
          </button>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, color: '#818cf8', background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <FileText size={10} /> Feedback
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface AIInsightProps {
  insights: { text: string; type: 'warning' | 'success' | 'info' }[];
}

export function AIInsights({ insights }: AIInsightProps) {
  const cfg = {
    warning: { bg: 'rgba(245,158,11,0.07)', c: '#f59e0b' },
    success: { bg: 'rgba(16,185,129,0.07)', c: '#10b981' },
    info:    { bg: 'rgba(99,102,241,0.07)', c: '#6366f1' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {insights.map((ins, i) => {
        const c = cfg[ins.type];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i*0.06 }}
            style={{
              padding: '12px 14px', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 12,
              background: c.bg, border: `1px solid ${c.c}25`
            }}
          >
            <div style={{ width: 3, height: 16, borderRadius: 2, background: c.c, flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-med)', fontWeight: 500 }}>
              {ins.text}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

export function SkillBar({ name, value, color, delay = 0 }: { name: string; value: number; color: string; delay?: number }) {
  return (
    <motion.div className="animate-fade-up" style={{ animationDelay: `${delay}s` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-med)' }}>{name}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}%</span>
      </div>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.16,1,0.3,1] }}
          style={{ background: `linear-gradient(90deg, ${color}90, ${color})` }}
        />
      </div>
    </motion.div>
  );
}
