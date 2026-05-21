'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Share2, Download, Code2, MessageSquare, TrendingUp, Target,
  ChevronDown, ChevronUp, CheckCircle, Loader2, AlertCircle,
  BookOpen, ExternalLink, Mic, Trophy, TrendingUp as ChartLine, Dumbbell, Star, Award, Crosshair
} from 'lucide-react';

const C = {
  primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E',
  warning: '#FFB547', error: '#FF4D6A', grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

const ScorePill = ({ score }: { score: number }) => {
  const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.error;
  return (
    <span style={{ background: `${color}22`, color, borderRadius: 20, padding: '3px 10px', fontSize: 13, fontWeight: 600, border: `1px solid ${color}33` }}>
      {score}%
    </span>
  );
};

interface QuestionBreakdown {
  question_id: string;
  question_text: string;
  answer_text: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  keywords_used: string[];
  keywords_missed: string[];
  filler_word_count: number;
}

interface ReportData {
  id: number;
  session_id: number;
  overall_score: number;
  session_summary: string;
  skill_scores: Record<string, number>;
  category_scores: Record<string, any>;
  strengths: string[];
  areas_to_improve: string[];
  missing_skills: string[];
  recommended_resources: { skill: string; link: string; type: string }[];
  generated_at: string;
  pdf_path?: string;
}

export default function ReportDashboard({ sessionId }: { sessionId?: string | number }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.98 };

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        // Step 1: Try to get existing report, or generate one
        let sid = sessionId;
        if (sid === 'latest' || sid === 'demo123') sid = undefined;

        if (!sid) {
          // Fallback: use last session from recent sessions list
          const sessRes = await fetch('/api/user/sessions/recent', { headers });
          if (sessRes.ok) {
            const sessions = await sessRes.json();
            sid = sessions?.[0]?.id;
          }
        }

        if (!sid) throw new Error('No session found. Complete an interview to see your report.');

        // Step 2: Generate (or regenerate) the report to get fresh data
        const genRes = await fetch(`/api/report/generate/${sid}`, {
          method: 'POST',
          headers,
        });

        if (!genRes.ok) {
          // If generation fails, try fetching existing
          const getRes = await fetch(`/api/report/${sid}`, { headers });
          if (!getRes.ok) throw new Error('Report not found. Please complete an interview first.');
          setReport(await getRes.json());
        } else {
          setReport(await genRes.json());
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not load report.');
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [sessionId]);

  const handleDownloadPDF = async () => {
    if (report?.pdf_path) {
      // Open the pre-rendered professional ReportLab PDF directly from FastAPI server static path
      window.open(`http://127.0.0.1:8000${report.pdf_path}`, '_blank');
      return;
    }

    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      if (!element) return;
      await html2pdf().set({
        margin: 10, filename: 'HireReady_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(element).save();
    } catch (e) {
      console.error('PDF generation failed', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const role = report?.category_scores?._target_role || 'Interview';
    const score = report?.overall_score ?? 0;
    const text = `🎯 HireReady Interview Report\nRole: ${role}\nScore: ${score}/100\n\nPractice smarter at hireready.io`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no-op */ }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Generating your performance report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <AlertCircle size={36} color={C.error} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Report Unavailable</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  if (!report) return null;

  const score = Math.round(report.overall_score);
  const catScores = report.category_scores || {};
  const questionsBreakdown: QuestionBreakdown[] = catScores._questions_breakdown || [];
  const targetRole = catScores._target_role || 'Interview';
  const difficulty = catScores._difficulty || 'Medium';
  const questionsCount = catScores._questions_count ?? questionsBreakdown.length;

  const metrics = [
    { label: 'Technical Accuracy', val: Math.round(catScores.technical_accuracy || 0), color: C.primary, icon: Code2 },
    { label: 'Communication',      val: Math.round(catScores.communication || 0),      color: C.accent,   icon: MessageSquare },
    { label: 'Depth',              val: Math.round(catScores.depth || 0),               color: C.warning,  icon: TrendingUp },
    { label: 'Confidence',         val: Math.round(catScores.confidence || 0),          color: C.success,  icon: Target },
  ];

  const radarLabels = ['Technical', 'Communication', 'Depth', 'Clarity', 'Confidence'];
  const radarPoints = [
    catScores.technical_accuracy || 0,
    catScores.communication || 0,
    catScores.depth || 0,
    Math.min(100, (catScores.technical_accuracy || 0) * 0.9),
    catScores.confidence || 0,
  ];
  const cx = 160, cy = 160, rr = 110;
  const pts = radarPoints.map((v, i) => {
    const angle = (i / radarPoints.length) * 2 * Math.PI - Math.PI / 2;
    const d = (v / 100) * rr;
    return { x: cx + d * Math.cos(angle), y: cy + d * Math.sin(angle) };
  });
  const polyPoints = pts.map(p => `${p.x},${p.y}`).join(' ');

  const scoreColor = score >= 80 ? C.success : score >= 60 ? C.warning : C.error;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Session Report</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-1px', marginBottom: 6 }}>Final Report</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {targetRole} · {difficulty} · {questionsCount} question{questionsCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <motion.button className="btn-ghost" style={{ padding: '10px 18px', fontSize: 14, gap: 6, display: 'flex', alignItems: 'center' }}
            onClick={handleShare} whileHover={hoverLift} whileTap={tapDown} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            {copied ? <CheckCircle size={14} color={C.success} /> : <Share2 size={14} />}
            {copied ? 'Copied!' : 'Share Report'}
          </motion.button>
          <motion.button className="btn-ghost" style={{ padding: '10px 18px', fontSize: 14, gap: 6, display: 'flex', alignItems: 'center', opacity: downloading ? 0.6 : 1 }}
            onClick={handleDownloadPDF} disabled={downloading} whileHover={downloading ? undefined : hoverLift}
            whileTap={downloading ? undefined : tapDown} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <Download size={14} /> {downloading ? 'Generating...' : 'Download PDF'}
          </motion.button>
        </div>
      </div>

      <div ref={reportRef}>
        {/* Score Card */}
        <div className="card fade-up-1 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center p-6 sm:p-9 mb-6"
          style={{ background: `linear-gradient(135deg, ${C.primary}12, ${C.accent}06)`, border: `1px solid ${C.primary}22` }}>
          <div>
            <div style={{ fontSize: 12, color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Overall Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(80px,10vw,110px)', lineHeight: 1, letterSpacing: '-4px', color: scoreColor, animation: 'countUp 0.8s ease' }}>
                {score}
              </span>
              <span style={{ fontSize: 28, color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif' }}>/100</span>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.6 }}>
              {report.session_summary}
            </p>
            {score > 0 && (
              <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: `${scoreColor}15`, border: `1px solid ${scoreColor}33`, borderRadius: 20, padding: '6px 14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', color: scoreColor }}>
                  {score >= 80 ? <Trophy size={16} /> : score >= 60 ? <ChartLine size={16} /> : <Dumbbell size={16} />}
                </span>
                <span style={{ fontSize: 13, color: scoreColor, fontWeight: 600 }}>
                  {score >= 80 ? `Top performer for ${targetRole}` : score >= 60 ? 'Good progress — keep practising!' : 'Early stage — more practice will help!'}
                </span>
              </div>
            )}
          </div>
          {/* Radar Chart */}
          <svg width={320} height={320} viewBox="0 0 320 320">
            <defs>
              <radialGradient id="radarFill" cx="50%" cy="50%">
                <stop offset="0%" stopColor={C.primary} stopOpacity="0.3" />
                <stop offset="100%" stopColor={C.accent} stopOpacity="0.1" />
              </radialGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map(scale => {
              const gpts = radarLabels.map((_, i) => {
                const angle = (i / radarLabels.length) * 2 * Math.PI - Math.PI / 2;
                return `${cx + rr * scale * Math.cos(angle)},${cy + rr * scale * Math.sin(angle)}`;
              }).join(' ');
              return <polygon key={scale} points={gpts} fill="none" stroke="var(--border)" strokeWidth="1" />;
            })}
            {radarLabels.map((_, i) => {
              const angle = (i / radarLabels.length) * 2 * Math.PI - Math.PI / 2;
              return <line key={i} x1={cx} y1={cy} x2={cx + rr * Math.cos(angle)} y2={cy + rr * Math.sin(angle)} stroke="var(--border)" strokeWidth="1" />;
            })}
            <polygon points={polyPoints} fill="url(#radarFill)" stroke={C.primary} strokeWidth="2" />
            {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={C.primary} />)}
            {radarLabels.map((label, i) => {
              const angle = (i / radarLabels.length) * 2 * Math.PI - Math.PI / 2;
              return <text key={i} x={cx + (rr + 22) * Math.cos(angle)} y={cy + (rr + 22) * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize="12" fontFamily="DM Sans">{label}</text>;
            })}
          </svg>
        </div>

        {/* Metric Cards */}
        <div className="fade-up-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map(m => (
            <div key={m.label} className="card" style={{ padding: 24, borderTop: `3px solid ${m.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <m.icon size={14} color={m.color} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{m.label}</span>
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color: m.color, marginBottom: 12 }}>
                {m.val}<span style={{ fontSize: 16 }}>%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--elevated)' }}>
                <div style={{ height: '100%', width: `${m.val}%`, borderRadius: 2, background: m.color, boxShadow: `0 0 8px ${m.color}66` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Voice Analytics Dashboard */}
        <div className="card fade-up-3 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center p-6 sm:p-9 mb-6" style={{ background: 'var(--card-bg)' }}>
          <div style={{ gridColumn: '1 / -1', marginBottom: '-8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mic size={20} color={C.primary} />
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text-high)' }}>
              Voice & Delivery Analytics
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: 'var(--elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Speaking Pace</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: (catScores.avg_wpm || 0) === 0 ? 'var(--text-subtle)' : (catScores.avg_wpm || 0) > 110 && (catScores.avg_wpm || 0) < 160 ? C.success : C.warning }}>
                {catScores.avg_wpm || 0}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>WPM</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.4 }}>
              {(catScores.avg_wpm || 0) === 0 ? "No voice data captured." : (catScores.avg_wpm || 0) < 110 ? "A bit slow. Try to speak more fluidly." : (catScores.avg_wpm || 0) > 160 ? "Too fast! Slow down for clarity." : "Perfect conversational pace!"}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: 'var(--elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Filler Words</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: (catScores.avg_wpm || 0) === 0 ? 'var(--text-subtle)' : (catScores.total_fillers || 0) > 10 ? C.error : (catScores.total_fillers || 0) > 5 ? C.warning : C.success }}>
                {catScores.total_fillers || 0}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>words</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.4 }}>
              {(catScores.avg_wpm || 0) === 0 ? "No voice data captured." : (catScores.total_fillers || 0) <= 5 ? "Excellent! Very clear delivery." : "Try to pause silently instead of using 'um' or 'uh'."}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: 'var(--elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Long Pauses</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: (catScores.avg_wpm || 0) === 0 ? 'var(--text-subtle)' : (catScores.total_pauses || 0) > 5 ? C.warning : C.success }}>
                {catScores.total_pauses || 0}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>pauses</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.4 }}>
              {(catScores.avg_wpm || 0) === 0 ? "No voice data captured." : (catScores.total_pauses || 0) <= 5 ? "Great flow and confidence." : "You had a few long hesitations while thinking."}
            </p>
          </div>
        </div>

        {/* Per-Question Breakdown — REAL DATA */}
        <div className="card fade-up-3" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
            Per-Question Breakdown
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Sans', fontWeight: 400, marginLeft: 10 }}>
              {questionsBreakdown.length} question{questionsBreakdown.length !== 1 ? 's' : ''} answered
            </span>
          </h3>

          {questionsBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No answers recorded in this session.</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>Complete a practice interview to see your per-question breakdown here.</p>
            </div>
          ) : (
            questionsBreakdown.map((q, i) => {
              const isOpen = expandedQ === i;
              const qScore = Math.round(q.score);
              const qColor = qScore >= 80 ? C.success : qScore >= 60 ? C.warning : C.error;
              return (
                <div key={i} style={{ padding: '16px 0', borderBottom: i < questionsBreakdown.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Q{i + 1}: {q.question_text}</div>
                    <ScorePill score={qScore} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{q.feedback}</p>

                  {/* Keywords row */}
                  {(q.keywords_used.length > 0 || q.keywords_missed.length > 0) && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {q.keywords_used.slice(0, 4).map(kw => (
                        <span key={kw} style={{ fontSize: 11, background: `${C.success}15`, border: `1px solid ${C.success}33`, color: C.success, borderRadius: 12, padding: '2px 8px' }}>✓ {kw}</span>
                      ))}
                      {q.keywords_missed.slice(0, 3).map(kw => (
                        <span key={kw} style={{ fontSize: 11, background: `${C.error}15`, border: `1px solid ${C.error}33`, color: C.error, borderRadius: 12, padding: '2px 8px' }}>✗ {kw}</span>
                      ))}
                    </div>
                  )}

                  {/* Answer transcript toggle */}
                  {q.answer_text && (
                    <motion.button onClick={() => setExpandedQ(isOpen ? null : i)}
                      style={{ background: 'none', border: `1px solid var(--border)`, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}
                      whileHover={hoverLift} whileTap={tapDown} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                      {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {isOpen ? 'Hide' : 'View'} Your Answer
                    </motion.button>
                  )}

                  {isOpen && q.answer_text && (
                    <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 8, background: `rgba(108,71,255,0.05)`, border: `1px solid ${C.primary}22`, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      <div style={{ fontSize: 10, color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>Your Answer</div>
                      "{q.answer_text}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Strengths & Improvements */}
        {(report.strengths.length > 0 || report.areas_to_improve.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 fade-up-3">
            {report.strengths.length > 0 && (
              <div className="card" style={{ padding: 24, borderLeft: `4px solid ${C.success}` }}>
                <h4 style={{ fontWeight: 700, fontSize: 14, color: C.success, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={16} /> Strengths
                </h4>
                {report.strengths.map((s, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>• {s}</p>)}
              </div>
            )}
            {report.areas_to_improve.length > 0 && (
              <div className="card" style={{ padding: 24, borderLeft: `4px solid ${C.warning}` }}>
                <h4 style={{ fontWeight: 700, fontSize: 14, color: C.warning, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Crosshair size={16} /> Areas to Improve
                </h4>
                {report.areas_to_improve.map((s, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>• {s}</p>)}
              </div>
            )}
          </div>
        )}

        {/* 4-Week Study Roadmap CTA */}
        <motion.div
          className="card fade-up-3 mb-6"
          style={{
            padding: '28px',
            background: 'linear-gradient(135deg, rgba(108,71,255,0.08) 0%, rgba(0,229,255,0.05) 100%)',
            border: '1px solid rgba(108,71,255,0.22)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
          whileHover={hoverLift}
          whileTap={tapDown}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,71,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trophy size={22} color={C.primary} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                🚀 Your Personalized 4-Week Learning Roadmap
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Based on the competency gaps identified during your practice session, we have generated a structured 4-week study plan to master your missing skills for the <strong style={{ color: 'var(--text-high)' }}>{targetRole}</strong> role.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => (window.location.href = `/roadmap/${report.session_id}`)}
              className="btn"
              style={{
                background: C.grad,
                border: 'none',
                color: 'white',
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 10,
                cursor: 'pointer',
                boxShadow: `0 4px 15px rgba(108,71,255,0.22)`,
              }}
            >
              Open 4-Week Study Plan →
            </button>
          </div>
        </motion.div>

        {/* Learning Resources */}
        {report.recommended_resources.length > 0 && (
          <div className="card fade-up-3" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              <BookOpen size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Recommended Resources
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {report.recommended_resources.map((r, i) => (
                <a key={i} href={r.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--elevated)', border: '1px solid var(--border)', textDecoration: 'none', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <span style={{ fontSize: 12, background: `${C.primary}15`, color: C.primary, border: `1px solid ${C.primary}33`, borderRadius: 8, padding: '2px 8px', fontWeight: 600 }}>{r.skill}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>{r.type.charAt(0).toUpperCase() + r.type.slice(1)}</span>
                  <ExternalLink size={12} color="var(--text-subtle)" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
