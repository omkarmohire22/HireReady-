'use client';
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import CommunicationFeedback from '@/components/practice/CommunicationFeedback';
import { BarChart3, MessageSquare, Mic, ArrowLeft, Loader2, AlertCircle, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

const C = {
  primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E',
  warning: '#FFB547', error: '#FF4D6A',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'so', 'right'];

export default function CommunicationReportPage() {
  const params = useParams();
  const sessionId = (Array.isArray(params?.sessionId) ? params.sessionId[0] : params?.sessionId) || 'demo123';
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [questionBreakdowns, setQuestionBreakdowns] = useState<any[]>([]);
  const [mockMetrics, setMockMetrics] = useState<any>({});
  const [fillerCounts, setFillerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const getRes = await api.getReport(sessionId as string);
        setReport(getRes);
        
        const catScores = getRes.category_scores || {};
        const qBreakdowns = catScores._questions_breakdown || [];
        
        const formattedBreakdowns = qBreakdowns.map((q: any) => {
          const metrics = q.communication_metrics || {};
          return {
            q: q.question_text || 'Unknown Question',
            wpm: Math.round(metrics.wpm || 0),
            fillers: q.filler_word_count || 0,
            pauses: metrics.pause_count || 0,
            energy: metrics.energy_consistency_score ? Math.round(metrics.energy_consistency_score * 10) : 0,
            tone: metrics.confidence_score || 0,
            filler_words_used: metrics.filler_words_used || []
          };
        });

        setQuestionBreakdowns(formattedBreakdowns);

        const totalWpm = formattedBreakdowns.reduce((a: number, q: any) => a + q.wpm, 0);
        const totalEnergy = formattedBreakdowns.reduce((a: number, q: any) => a + q.energy, 0);
        const totalTone = formattedBreakdowns.reduce((a: number, q: any) => a + q.tone, 0);

        setMockMetrics({
          wpm: formattedBreakdowns.length > 0 ? Math.round(totalWpm / formattedBreakdowns.length) : 0,
          fillerWords: formattedBreakdowns.reduce((a: number, q: any) => a + q.fillers, 0),
          longPauses: formattedBreakdowns.reduce((a: number, q: any) => a + q.pauses, 0),
          voiceEnergy: formattedBreakdowns.length > 0 ? Math.round(totalEnergy / formattedBreakdowns.length) : 0,
          confidenceTone: formattedBreakdowns.length > 0 ? Math.round((totalTone / formattedBreakdowns.length) * 10) / 10 : 0,
        });

        const newFillerCounts: Record<string, number> = {};
        formattedBreakdowns.forEach((q: any) => {
          if (q.filler_words_used) {
            q.filler_words_used.forEach((word: string) => {
              newFillerCounts[word] = (newFillerCounts[word] || 0) + 1;
            });
          }
        });
        setFillerCounts(newFillerCounts);

      } catch (err: any) {
        setError(err.message || 'Could not load communication report.');
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading communication analysis…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <AlertCircle size={36} color={C.error} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Analysis Unavailable</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  const role = report?.category_scores?._target_role || 'Interview';
  const totalQuestions = questionBreakdowns.length;

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
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{role} · {totalQuestions} questions</p>
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
              {questionBreakdowns.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No questions answered yet.</td>
                </tr>
              )}
              {questionBreakdowns.map((row, i) => {
                const wpmOk = row.wpm >= 120 && row.wpm <= 150;
                const wpmColor = row.wpm === 0 ? 'var(--text-muted)' : wpmOk ? C.success : C.warning;
                const fillerColor = row.fillers <= 2 ? C.success : row.fillers <= 5 ? C.warning : C.error;
                const pauseColor = row.pauses === 0 ? C.success : row.pauses <= 1 ? C.warning : C.error;
                const energyColor = row.energy >= 70 ? C.success : row.energy >= 50 ? C.warning : C.error;
                const toneColor = row.tone >= 7 ? C.success : row.tone >= 5 ? C.warning : C.error;
                return (
                  <tr key={i} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>Q{i+1}: {row.q}</td>
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
      {questionBreakdowns.length > 0 && (
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
              const barH = Math.min(100, Math.round((q.wpm / 200) * 100));
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
      )}

      {/* 4-Week Study Roadmap CTA */}
      <motion.div
        className="card fade-up-4 p-6 mt-6"
        data-aos="fade-up"
        data-aos-delay={220}
        style={{
          background: 'linear-gradient(135deg, rgba(108,71,255,0.08) 0%, rgba(0,229,255,0.05) 100%)',
          border: '1px solid rgba(108,71,255,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,71,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} color={C.primary} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, marginBottom: 2 }}>
              🚀 Personalized 4-Week Study Roadmap
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              A structured, AI-tailored study plan to refine your skills and master your communication.
            </p>
          </div>
        </div>
        <button
          onClick={() => (window.location.href = `/roadmap/${sessionId}`)}
          className="btn"
          style={{
            background: C.grad,
            border: 'none',
            color: 'white',
            padding: '10px 24px',
            fontSize: 13.5,
            fontWeight: 600,
            borderRadius: 10,
            cursor: 'pointer',
            boxShadow: `0 4px 15px rgba(108,71,255,0.22)`,
            whiteSpace: 'nowrap',
          }}
        >
          View 4-Week Roadmap →
        </button>
      </motion.div>
    </div>
  );
}
