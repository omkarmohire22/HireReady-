'use client';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import CommunicationFeedback from '@/components/practice/CommunicationFeedback';
import { BarChart3, MessageSquare, Mic, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const C = {
  primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E',
  warning: '#FFB547', error: '#FF4D6A',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

// Mock detailed per-question communication breakdown
const questionBreakdowns = [
  { q: 'Q1: Explain React reconciliation', wpm: 134, fillers: 1, pauses: 0, energy: 80, tone: 8.2 },
  { q: 'Q2: Optimize a slow API endpoint',  wpm: 148, fillers: 3, pauses: 1, energy: 72, tone: 7.0 },
  { q: 'Q3: Design a notification system',  wpm: 112, fillers: 6, pauses: 2, energy: 55, tone: 5.8 },
];

const mockMetrics = {
  wpm: Math.round(questionBreakdowns.reduce((a, q) => a + q.wpm, 0) / questionBreakdowns.length),
  fillerWords: questionBreakdowns.reduce((a, q) => a + q.fillers, 0),
  longPauses: questionBreakdowns.reduce((a, q) => a + q.pauses, 0),
  voiceEnergy: Math.round(questionBreakdowns.reduce((a, q) => a + q.energy, 0) / questionBreakdowns.length),
  confidenceTone: Math.round((questionBreakdowns.reduce((a, q) => a + q.tone, 0) / questionBreakdowns.length) * 10) / 10,
};

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally'];
const fillerCounts: Record<string, number> = { um: 4, uh: 2, like: 3, 'you know': 1 };

export default function CommunicationReportPage() {
  const params = useParams();
  const sessionId = params?.sessionId || 'demo123';
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }} data-aos="fade-up">
      {/* Header */}
      <div className="fade-up" data-aos="fade-up" style={{ marginBottom: 32 }}>
        <Link href={`/report/${sessionId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 16 }}
          onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={14} /> Back to Report
        </Link>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Deep Dive</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-1px', marginBottom: 6 }}>
          <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Communication</span> Report
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Frontend Developer · Amazon · 3 questions</p>
      </div>

      {/* Overall Communication Metrics */}
      <motion.div
        className="card fade-up-1 p-6 mb-6"
        data-aos="fade-up"
        data-aos-delay={80}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <CommunicationFeedback metrics={mockMetrics} />
      </motion.div>

      {/* Filler Word Breakdown */}
      <motion.div
        className="card fade-up-2 p-6 mb-6"
        data-aos="fade-up"
        data-aos-delay={120}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Mic size={18} color={C.primary} />
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>Filler Word Usage</h3>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: C.warning, background: `${C.warning}18`, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
            {mockMetrics.fillerWords} total detected
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(fillerCounts).map(([word, count]) => {
            const intensity = count <= 1 ? C.success : count <= 3 ? C.warning : C.error;
            return (
              <div key={word} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${intensity}44`, background: `${intensity}10`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: intensity }}>"{word}"</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>×{count}</span>
              </div>
            );
          })}
          {FILLER_WORDS.filter(w => !fillerCounts[w]).map(w => (
            <div key={w} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--elevated)', display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-muted)' }}>"{w}"</span>
              <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>×0</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Per-Question Breakdown */}
      <motion.div
        className="card fade-up-3 p-6 mb-6"
        data-aos="fade-up"
        data-aos-delay={160}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <MessageSquare size={18} color={C.accent} />
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>Per-Question Communication</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Question', 'WPM', 'Fillers', 'Pauses', 'Energy', 'Tone'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questionBreakdowns.map((row, i) => {
                const wpmOk = row.wpm >= 120 && row.wpm <= 150;
                const wpmColor = wpmOk ? C.success : C.warning;
                const fillerColor = row.fillers <= 2 ? C.success : row.fillers <= 5 ? C.warning : C.error;
                const pauseColor = row.pauses === 0 ? C.success : row.pauses <= 1 ? C.warning : C.error;
                const energyColor = row.energy >= 70 ? C.success : row.energy >= 50 ? C.warning : C.error;
                const toneColor = row.tone >= 7 ? C.success : row.tone >= 5 ? C.warning : C.error;
                return (
                  <tr key={i} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{row.q}</td>
                    <td style={{ padding: '12px', color: wpmColor, fontWeight: 700 }}>{row.wpm}</td>
                    <td style={{ padding: '12px', color: fillerColor, fontWeight: 700 }}>{row.fillers}</td>
                    <td style={{ padding: '12px', color: pauseColor, fontWeight: 700 }}>{row.pauses}</td>
                    <td style={{ padding: '12px', color: energyColor, fontWeight: 700 }}>{row.energy}%</td>
                    <td style={{ padding: '12px', color: toneColor, fontWeight: 700 }}>{row.tone}/10</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Speaking Pace Timeline */}
      <motion.div
        className="card fade-up-4 p-6"
        data-aos="fade-up"
        data-aos-delay={200}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <BarChart3 size={18} color={C.success} />
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>Speaking Pace Over Session</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
          {questionBreakdowns.map((q, i) => {
            const barH = Math.round((q.wpm / 200) * 100);
            const barColor = q.wpm >= 120 && q.wpm <= 150 ? C.success : q.wpm < 120 ? C.warning : C.error;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{q.wpm} WPM</span>
                <div style={{ width: '100%', height: `${barH}%`, background: barColor, borderRadius: '6px 6px 0 0', boxShadow: `0 0 10px ${barColor}55`, transition: 'height 0.6s ease' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>Q{i + 1}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ height: 2, flex: 1, borderTop: `2px dashed ${C.success}55` }} />
          <span style={{ fontSize: 11, color: C.success, whiteSpace: 'nowrap' }}>Ideal: 120–150 WPM</span>
          <div style={{ height: 2, flex: 1, borderTop: `2px dashed ${C.success}55` }} />
        </div>
      </motion.div>
    </div>
  );
}
