'use client';
import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Share2, Download, Code2, MessageSquare, TrendingUp, Target, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

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

const questions = [
  {
    q: "Explain React's reconciliation algorithm",
    score: 85,
    feedback: 'Strong answer with concrete examples. Could improve: mention fiber architecture.',
    transcript: "React's reconciliation is the process by which React updates the DOM. It uses a diffing algorithm to compare the new virtual DOM with the previous one. React uses a heuristic O(n) algorithm instead of the typical O(n³) solution. When elements are of different types, React tears down the old tree and rebuilds. For lists, it uses keys to identify which items changed.",
  },
  {
    q: 'How would you optimize a slow API endpoint?',
    score: 78,
    feedback: 'Good coverage of caching strategies. Missed database indexing discussion.',
    transcript: "I would start by profiling the endpoint to identify bottlenecks. Then I'd look at implementing caching layers using Redis for frequently accessed data. I'd also look at query optimization, connection pooling, and potentially use pagination if large datasets are involved. Compression like gzip can also reduce payload size significantly.",
  },
  {
    q: 'Design a real-time notification system',
    score: 72,
    feedback: 'Solid WebSocket approach. Consider mentioning fallback mechanisms.',
    transcript: "For a real-time notification system, I'd use WebSockets for persistent bidirectional connections. The server would maintain a registry of connected clients. When an event occurs, the notification would be pushed through the socket. I'd also consider using a message queue like RabbitMQ for reliability and to handle high traffic.",
  },
];

export default function ReportDashboard() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.98 };

  const score = 79;
  const metrics = [
    { label: 'Technical Accuracy', val: 78, color: C.primary, icon: Code2 },
    { label: 'Communication',      val: 82, color: C.accent,  icon: MessageSquare },
    { label: 'Confidence',         val: 65, color: C.warning, icon: TrendingUp },
    { label: 'Answer Clarity',     val: 74, color: C.success, icon: Target },
  ];

  const radarLabels = ['Technical', 'Communication', 'Confidence', 'Clarity', 'Depth'];
  const radarPoints = [78, 82, 65, 74, 80];
  const cx = 160, cy = 160, rr = 110;

  const pts = radarPoints.map((v, i) => {
    const angle = (i / radarPoints.length) * 2 * Math.PI - Math.PI / 2;
    const d = (v / 100) * rr;
    return { x: cx + d * Math.cos(angle), y: cy + d * Math.sin(angle) };
  });
  const polyPoints = pts.map(p => `${p.x},${p.y}`).join(' ');

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      if (!element) return;
      await html2pdf().set({
        margin: 10,
        filename: 'HireReady_Report.pdf',
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
    const text = `🎯 HireReady Interview Report\nRole: Frontend Developer\nScore: ${score}/100\nTech: 78% | Comms: 82% | Confidence: 65%\n\nPractice smarter at hireready.io`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no-op */ }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Session Report</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-1px', marginBottom: 6 }}>Final Report</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Frontend Developer · Amazon (Simulated) · 3 questions</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <motion.button
            className="btn-ghost"
            style={{ padding: '10px 18px', fontSize: 14, gap: 6, display: 'flex', alignItems: 'center' }}
            onClick={handleShare}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            {copied ? <CheckCircle size={14} color={C.success} /> : <Share2 size={14} />}
            {copied ? 'Copied!' : 'Share Report'}
          </motion.button>
          <motion.button
            className="btn-ghost"
            style={{ padding: '10px 18px', fontSize: 14, gap: 6, display: 'flex', alignItems: 'center', opacity: downloading ? 0.6 : 1 }}
            onClick={handleDownloadPDF}
            disabled={downloading}
            whileHover={downloading ? undefined : hoverLift}
            whileTap={downloading ? undefined : tapDown}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <Download size={14} /> {downloading ? 'Generating...' : 'Download PDF'}
          </motion.button>
        </div>
      </div>

      {/* Printable section */}
      <div ref={reportRef}>
        {/* Main Score Card */}
        <div className="card fade-up-1 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center p-6 sm:p-9 mb-6" style={{
          background: `linear-gradient(135deg, ${C.primary}12, ${C.accent}06)`,
          border: `1px solid ${C.primary}22`,
        }}>
          <div>
            <div style={{ fontSize: 12, color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Overall Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
              <span style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: 'clamp(80px,10vw,110px)', lineHeight: 1, letterSpacing: '-4px',
                color: score >= 80 ? C.success : score >= 60 ? C.warning : C.error,
                animation: 'countUp 0.8s ease',
              }}>{score}</span>
              <span style={{ fontSize: 28, color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif' }}>/100</span>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.6 }}>
              Strong performance! You demonstrated solid technical depth. Focus on boosting confidence and answer structure.
            </p>
            {/* Comparative callout */}
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: `${C.success}15`, border: `1px solid ${C.success}33`, borderRadius: 20, padding: '6px 14px' }}>
              <span style={{ fontSize: 16 }}>🏆</span>
              <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>Top 30% of Frontend Developer candidates</span>
            </div>
          </div>

          {/* Radar chart */}
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
              const lx = cx + (rr + 22) * Math.cos(angle);
              const ly = cy + (rr + 22) * Math.sin(angle);
              return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize="12" fontFamily="DM Sans">{label}</text>;
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

        {/* Per Question — with Transcript */}
        <div className="card fade-up-3" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Per-Question Breakdown</h3>
          {questions.map((q, i) => {
            const isOpen = expandedQ === i;
            return (
              <div key={i} style={{ padding: '16px 0', borderBottom: i < questions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, maxWidth: '70%' }}>Q{i + 1}: {q.q}</div>
                  <ScorePill score={q.score} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{q.feedback}</p>

                {/* Transcript toggle */}
                <motion.button
                  onClick={() => setExpandedQ(isOpen ? null : i)}
                  style={{
                    background: 'none', border: `1px solid var(--border)`, borderRadius: 8,
                    padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  whileHover={hoverLift}
                  whileTap={tapDown}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                >
                  {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {isOpen ? 'Hide' : 'View'} Your Answer
                </motion.button>

                {isOpen && (
                  <div style={{
                    marginTop: 12, padding: '14px 16px', borderRadius: 8,
                    background: 'rgba(108,71,255,0.05)', border: `1px solid ${C.primary}22`,
                    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
                    animation: 'fadeIn 0.2s ease',
                  }}>
                    <div style={{ fontSize: 10, color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
                      Your Transcribed Answer
                    </div>
                    "{q.transcript}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
