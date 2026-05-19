'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterviewAudio } from '@/hooks/useInterviewAudio';
import { Timer, Lightbulb, Pause, Play, CheckCheck, ChevronRight, ChevronLeft, Download, Save } from 'lucide-react';

import { api } from '@/lib/api';
import { useInterviewSessionStore } from '@/lib/interviewSessionStore';

const THEME = {
  AI_SPEAKING:   '#6366F1',
  USER_ANSWERING:'#06B6D4',
  EVALUATING:    '#F59E0B',
} as const;

const QUESTION_TIME = 120;

/* ── ZONE 1: AI ORB & TEXT ── */
const NeuralOrb = ({ isSpeaking }: { isSpeaking: boolean }) => (
  <div className="relative flex items-center justify-center shrink-0 w-[72px] h-[72px]">
    <AnimatePresence>
      {isSpeaking && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
          {[0, 0.5, 1].map((delay, i) => (
            <div key={i} className="absolute inset-0 rounded-full"
              style={{ boxShadow: '0 0 0 2px #6366F1', animation: `sonarRingAdvanced 2s ${delay}s ease-out infinite` }} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
    <div className="w-[72px] h-[72px] rounded-full overflow-hidden absolute">
      <div className="w-[140%] h-[140%] absolute -top-[20%] -left-[20%]"
        style={{ background: 'conic-gradient(from 0deg, #6366F1, #8B5CF6, #06B6D4, #6366F1)', animation: 'conicRotate 3s linear infinite' }} />
    </div>
    <div className="relative w-[56px] h-[56px] rounded-full bg-black/40 border border-white/20 backdrop-blur-[12px] z-10" />
  </div>
);

const TypewriterText = ({ text, isSpeaking }: { text: string; isSpeaking: boolean }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!isSpeaking) { setDisplayed(text); return; }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 28);
    return () => clearInterval(interval);
  }, [text, isSpeaking]);
  return (
    <p className="text-lg leading-relaxed font-medium">
      "{displayed}"{isSpeaking && displayed.length < text.length && <span className="text-[#6366F1] animate-pulse">|</span>}
    </p>
  );
};

const VoiceWaveIndicator = ({ isSpeaking }: { isSpeaking: boolean }) => (
  <div className="flex items-end justify-center gap-1 w-[32px] h-[20px]">
    {[0,1,2,3,4].map(i => (
      <div key={i} className="w-[2px] bg-[#818CF8] rounded-full transform origin-bottom transition-all duration-300"
        style={{ height: isSpeaking ? '100%' : '20%', animation: isSpeaking ? `eqSine 1s ${i * 0.15}s ease-in-out infinite` : 'none' }} />
    ))}
  </div>
);

/* ── ZONE 2: WAVEFORM ── */
const AdvancedWaveform = ({ fftData, isListening, rmsLevel, isSilent }: { fftData: Uint8Array; isListening: boolean; rmsLevel: number; isSilent: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentHeights = useRef<number[]>(new Array(64).fill(0));

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    const w = canvasRef.current.width, h = canvasRef.current.height;
    let raf: number;
    const barWidth = 3, gap = 2;
    const numBars = Math.floor(w / (barWidth + gap));
    const draw = () => {
      ctx.clearRect(0, 0, w, h * 2);
      for (let i = 0; i < Math.min(numBars, fftData.length); i++) {
        const target = isListening && !isSilent ? (fftData[i] / 255) * h * 0.9 : 2;
        currentHeights.current[i] += (target - currentHeights.current[i]) * 0.2;
        const barHeight = Math.max(2, currentHeights.current[i]);
        const x = i * (barWidth + gap), y = h - barHeight;
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#5C61E6'); grad.addColorStop(1, '#0FE0CD');
        ctx.fillStyle = grad; ctx.fillRect(x, y, barWidth, barHeight);
        ctx.globalAlpha = 0.4 - (barHeight / h) * 0.2;
        ctx.fillRect(x, h + 1, barWidth, barHeight * 0.5);
        ctx.globalAlpha = 1.0;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [fftData, isListening, isSilent]);

  const stripColor = rmsLevel < 30 ? '#22C55E' : rmsLevel < 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex flex-col gap-0 w-full relative">
      <div className="w-full h-[4px] bg-[var(--elevated)] mb-[10px] rounded-full overflow-hidden">
        <div className="h-full" style={{ width: '100%', background: isListening && !isSilent ? stripColor : 'transparent', transition: 'background 100ms ease' }} />
      </div>
      <canvas ref={canvasRef} width={600} height={40} className="w-full h-[60px]" style={{ imageRendering: 'pixelated' }} />
      <AnimatePresence>
        {isSilent && isListening && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-0 w-full text-center">
            <span className="text-[11px] text-[#06B6D4] font-bold tracking-widest uppercase animate-pulse">Listening...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── ZONE 3: GAUGES ── */
const ScoreGauge = ({ value, label, isEvaluating }: { value: number; label: string; isEvaluating: boolean }) => {
  const [displayVal, setDisplayVal] = useState(0);
  const size = 110, strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayVal / 100) * circ;
  const prevVal = useRef(0);
  const [particles, setParticles] = useState<{ id: number; angle: number }[]>([]);

  useEffect(() => {
    if (value === prevVal.current) return;
    if (value > prevVal.current) {
      const ps = Array.from({ length: 12 }).map((_, i) => ({ id: Date.now() + i, angle: (i * 30) * (Math.PI / 180) }));
      setParticles(ps);
      setTimeout(() => setParticles([]), 600);
    }
    let start = prevVal.current;
    const dur = 600, startTime = performance.now();
    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / dur, 1);
      setDisplayVal(start + (value - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
      else prevVal.current = value;
    };
    requestAnimationFrame(animate);
  }, [value]);

  const acColor = displayVal < 60 ? '#EF4444' : displayVal < 80 ? '#F59E0B' : '#06B6D4';
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-widest mb-4 h-4">{label}</div>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {particles.map(p => {
          const px = Math.cos(p.angle) * (r + 15), py = Math.sin(p.angle) * (r + 15);
          return (
            <motion.div key={p.id} className="absolute w-[4px] h-[4px] rounded-full bg-current" style={{ color: acColor }}
              initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [1, 1, 0], x: px, y: py }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          );
        })}
        <svg width={size} height={size} className="absolute top-0 left-0 -rotate-90 overflow-visible">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={acColor} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke 400ms ease, stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
        </svg>
        <div className="text-center font-['Syne'] font-extrabold" style={{ fontSize: size * 0.28, color: acColor, transition: 'color 400ms ease' }}>
          {Math.round(displayVal)}
        </div>
      </div>
    </div>
  );
};

/* ── QUESTION PROGRESS DOTS ── */
const QuestionProgress = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: i < current ? 24 : 8, height: 8, borderRadius: 4,
        background: i < current ? '#00D97E' : i === current ? '#6366F1' : 'var(--border)',
        transition: 'all 0.4s ease',
        boxShadow: i === current ? '0 0 8px #6366F155' : 'none',
      }} />
    ))}
    <span className="text-[12px] text-[var(--text-muted)] font-semibold ml-1">Q{current + 1}/{total}</span>
  </div>
);

/* ── MAIN COMPONENT ── */
export default function InterviewPanel({ onEnd }: { onEnd: () => void }) {
  const { session } = useInterviewSessionStore();
  const sessionId = session?.id || 1;

  const [qIndex, setQIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [currentQ, setCurrentQ] = useState<{ text: string; hint: string; tag: string; id: string; difficulty: string } | null>(null);
  const [isLoadingQ, setIsLoadingQ] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNextQuestion = async () => {
    setIsLoadingQ(true);
    try {
      const res = await api.getNextQuestion(sessionId);
      if (res.done) {
        onEnd();
      } else {
        setCurrentQ({
          text: res.question_text,
          hint: "Focus on your experience with " + res.skill,
          tag: res.skill,
          id: res.question_id,
          difficulty: res.difficulty || 'Medium',
        });
        setQIndex(res.question_number - 1);
        if (res.total_questions) setTotalQuestions(res.total_questions);
        setIsLoadingQ(false);
      }
    } catch (err) {
      console.error(err);
      setIsLoadingQ(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const [paused, setPaused] = useState(false);
  const { sessionState, isSpeaking, isListening, isEvaluating, currentWPM, rmsLevel, fftData, transcription, isSilent, startSpeaking, stopSession, saveRecording, downloadRecording, voiceAnalysis, isRecordingSaved, hasMicAccess } = useInterviewAudio(currentQ?.text || "", paused);

  const [counter, setCounter] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(QUESTION_TIME);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const [pulseScale, setPulseScale] = useState(1);
  const [mockScore, setMockScore] = useState({ tech: 78, comms: 91 });
  const [prevFeedback, setPrevFeedback] = useState<string | null>(null);

  const counterRef = useRef<NodeJS.Timeout | null>(null);
  const qTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Session timer counts up, pauses on pause
  useEffect(() => {
    if (currentQ && !isLoadingQ) {
      startSpeaking();
    }
  }, [currentQ, isLoadingQ, startSpeaking]);

  useEffect(() => {
    if (paused) {
      if (counterRef.current) clearInterval(counterRef.current);
      if (qTimerRef.current) clearInterval(qTimerRef.current);
    } else {
      counterRef.current = setInterval(() => setCounter(c => c + 1), 1000);
      qTimerRef.current = setInterval(() => setQuestionTimer(t => Math.max(0, t - 1)), 1000);
    }
    return () => {
      if (counterRef.current) clearInterval(counterRef.current);
      if (qTimerRef.current) clearInterval(qTimerRef.current);
    };
  }, [paused]);

  // Reset per-question state when question changes
  useEffect(() => {
    setQuestionTimer(QUESTION_TIME);
    setHintVisible(false);
    setHintUsed(false);
  }, [qIndex]);

  useEffect(() => {
    if (isListening) {
      const i = setInterval(() => { setPulseScale(1.05); setTimeout(() => setPulseScale(1), 200); }, 3000);
      return () => clearInterval(i);
    }
  }, [isListening]);

  useEffect(() => {
    if (isEvaluating) {
      setTimeout(() => {
        setMockScore({ tech: 85, comms: 94 });
        setPrevFeedback('Strong use of structured thinking. Add more specifics next time.');
      }, 2500);
    }
  }, [isEvaluating]);

  const handleSaveRecording = async () => {
    if (currentQ) {
      await saveRecording(String(sessionId), currentQ.id);
    }
  };

  const activeColor = THEME[sessionState];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const words = transcription.split(' ').filter(Boolean);

  const handleNextQuestion = async () => {
    if (!currentQ || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const scoreData = await api.submitAnswer(sessionId, {
        question_id: currentQ.id,
        question_text: currentQ.text,
        answer_text: transcription || "No verbal response detected.",
        communication_metrics: voiceAnalysis
      });
      
      setMockScore({ tech: Math.round(scoreData.score * 10), comms: 85 + Math.floor(Math.random() * 10) });
      setPrevFeedback(scoreData.feedback);
      
      await fetchNextQuestion();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowHint = () => {
    setHintVisible(true);
    setHintUsed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: paused ? 0.5 : 1 }}
      className="relative text-[var(--text)] transition-all duration-400"
      style={{ '--theme-accent': activeColor } as React.CSSProperties}
    >
      {/* ── PAUSE OVERLAY ── */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          >
            <div className="text-6xl">⏸</div>
            <h2 className="font-['Syne'] font-extrabold text-3xl text-white">Session Paused</h2>
            <p className="text-[var(--text-muted)] text-base">Timers are frozen. Resume when you're ready.</p>
            <button
              className="btn-primary flex items-center gap-2 px-8 py-4 text-base"
              onClick={() => setPaused(false)}
            >
              <Play size={18} /> Resume Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
        {/* Left: breadcrumb + question progress */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold flex items-center gap-2">
            <span className="text-[var(--text-muted)]">HireReady</span>
            <span className="text-xs text-[var(--text-subtle)]">/</span>
            <span className="text-[var(--text-high)]">Practice Arena</span>
          </div>
          <QuestionProgress current={qIndex} total={totalQuestions} />
        </div>

        {/* Right: timers + controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Q timer */}
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border text-[12px] font-bold tracking-widest uppercase ${
            questionTimer <= 10
              ? 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444] animate-pulse'
              : questionTimer <= 30
              ? 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]'
              : 'bg-[var(--elevated)] border-[var(--border)] text-[var(--text-muted)]'
          }`}>
            <Timer size={12} />
            <span>{formatTime(questionTimer)}</span>
          </div>

          {/* Session timer */}
          <div className="flex items-center gap-2 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-[pulse_1s_ease-in-out_infinite]" />
            <span className="text-[12px] text-[#EF4444] font-bold tracking-widest uppercase">REC · {formatTime(counter)}</span>
          </div>

          {/* Pause */}
          <button
            onClick={() => setPaused(p => !p)}
            title="Pause session"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 border text-[12px] font-bold bg-[var(--elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-white/30 transition-all"
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            {paused ? 'Resume' : 'Pause'}
          </button>

          {/* End session */}
          <button className="btn-ghost py-1.5 px-3 text-xs font-bold" onClick={() => { stopSession(); onEnd(); }}>End</button>
        </div>
      </div>

      {/* Role + Skill Tag + Difficulty Badge */}
      <div className="flex items-center gap-3 mb-6 mt-1 flex-wrap">
        <div className="font-['Syne'] font-extrabold text-2xl tracking-tight">{session?.role || 'Interview Session'}</div>
        {currentQ && (
          <>
            {/* Skill tag */}
            <span style={{
              fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.15)',
              color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 6, padding: '3px 10px', letterSpacing: 0.5,
            }}>
              {currentQ.tag}
            </span>
            {/* Difficulty badge */}
            {(() => {
              const diffColors: Record<string, { bg: string; color: string; border: string }> = {
                Easy:   { bg: 'rgba(0,217,126,0.12)',   color: '#00D97E', border: 'rgba(0,217,126,0.3)' },
                Medium: { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
                Hard:   { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', border: 'rgba(239,68,68,0.3)' },
              };
              const c = diffColors[currentQ.difficulty] ?? diffColors.Medium;
              return (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                  borderRadius: 6, padding: '3px 10px', letterSpacing: 0.5,
                }}>
                  {currentQ.difficulty}
                </span>
              );
            })()}
          </>
        )}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 max-w-6xl">

        {/* CENTER COLUMN */}
        <div className="flex flex-col gap-5">
          
          {isLoadingQ ? (
            <div className="flex items-center justify-center p-12 text-white">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
               <span className="ml-3">Loading next question...</span>
            </div>
          ) : currentQ && (
            <>

          {/* AI Question Card */}
          <div className="relative rounded-2xl p-6 transition-all duration-400"
            style={{
              borderColor: isSpeaking ? 'var(--theme-accent)' : 'var(--border)',
              borderWidth: 1, borderStyle: 'solid',
              opacity: isSpeaking ? 1 : 0.85,
            }}>
            {isSpeaking && (
              <div className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.1), transparent)', backgroundSize: '200% 100%', animation: 'borderShimmer 2.5s linear infinite' }} />
            )}
            <div className="relative flex gap-6 z-10 w-full">
              <NeuralOrb isSpeaking={isSpeaking} />
              <div className="flex-1 mt-1 shrink min-w-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-[var(--theme-accent)] font-bold uppercase tracking-[0.2em] transition-colors duration-400">Current Question</span>
                  {isSpeaking && <VoiceWaveIndicator isSpeaking={isSpeaking} />}
                </div>
                <TypewriterText text={currentQ.text} isSpeaking={isSpeaking} />
              </div>
            </div>

          </div>

          {/* User Answer Card */}
          <AnimatePresence>
            {(isListening || isEvaluating) && (
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}
                className="origin-center overflow-hidden rounded-2xl p-6 bg-[var(--card-bg)] border transition-all duration-400"
                style={{
                  borderColor: isListening ? 'var(--theme-accent)' : 'var(--border-strong)',
                  boxShadow: isListening ? '0 0 20px rgba(6,182,212,0.1)' : 'none',
                }}
              >
                <div className="flex justify-between items-center mb-5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em]">Your Live Transcription</span>
                  {isListening ? (
                    <motion.div animate={{ scale: pulseScale }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                        currentWPM >= 120 && currentWPM <= 150
                          ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                          : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                      }`}>
                      Pace: {currentWPM} WPM
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30 text-[var(--theme-accent)] text-[11px] font-bold uppercase tracking-wider">
                      Analyzing...
                    </div>
                  )}
                </div>

                <div className="min-h-[80px] mb-5">
                  {words.length === 0 ? (
                    <p className="text-[15px] italic opacity-40">Start speaking...</p>
                  ) : (
                    <p className="text-[15px] leading-relaxed">
                      <AnimatePresence>
                        {words.map((w, i) => (
                          <motion.span key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="inline-block mr-[4px]">
                            {w}
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </p>
                  )}
                </div>

                <div className="w-full relative transition-all duration-500" style={{ filter: isEvaluating ? 'blur(2px)' : 'none', opacity: isEvaluating ? 0.4 : 1 }}>
                  {/* Dynamic neon voice-amplitude ambient halo */}
                  {isListening && (
                    <motion.div 
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        zIndex: 0,
                        background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.2) 0%, transparent 80%)',
                        filter: 'blur(20px)',
                      }}
                      animate={{ 
                        scale: 1.0 + (rmsLevel / 100) * 0.5, 
                        opacity: 0.25 + (rmsLevel / 100) * 0.75 
                      }}
                      transition={{ type: 'spring', stiffness: 250, damping: 15 }}
                    />
                  )}
                  <div className="relative z-10 w-full">
                    <AdvancedWaveform fftData={fftData} isListening={isListening} rmsLevel={rmsLevel} isSilent={isSilent} />
                  </div>
                </div>

                {isEvaluating && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 w-full h-[3px] bg-[var(--elevated)] overflow-hidden rounded-full">
                    <div className="h-full bg-[#F59E0B]" style={{ width: '100%', animation: 'borderShimmer 1.8s ease-in-out infinite alternate' }} />
                  </motion.div>
                )}

                {/* Recording action buttons */}
                {(isListening || isEvaluating) && (
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <button
                      onClick={downloadRecording}
                      className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--elevated)] text-[var(--text-muted)] hover:text-white hover:border-white/20 transition-all"
                    >
                      <Download size={12} /> Download Recording
                    </button>
                    <button
                      onClick={handleSaveRecording}
                      disabled={isRecordingSaved}
                      className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-all"
                      style={{
                        borderColor: isRecordingSaved ? '#00D97E66' : 'var(--border)',
                        background: isRecordingSaved ? 'rgba(0,217,126,0.1)' : 'var(--elevated)',
                        color: isRecordingSaved ? '#00D97E' : 'var(--text-muted)',
                      }}
                    >
                      <Save size={12} /> {isRecordingSaved ? 'Saved to Profile!' : 'Save to Profile'}
                    </button>
                  </div>
                )}

                {/* Done / Next Question — always visible once listening or evaluating */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex items-center justify-between gap-3">
                  {/* Skip without answering */}
                  <button
                    onClick={() => handleNextQuestion()}
                    disabled={isSubmitting}
                    className="text-[12px] font-semibold text-[var(--text-subtle)] hover:text-white transition-colors disabled:opacity-40"
                  >
                    {isListening ? 'Skip (no answer)' : ''}
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] text-white transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                      boxShadow: '0 0 20px rgba(99,102,241,0.35)',
                    }}
                  >
                    <CheckCheck size={15} />
                    {isSubmitting ? 'Submitting…' : isEvaluating ? 'Next Question →' : (qIndex < totalQuestions - 1 ? 'Done — Next Question →' : 'Done — Finish Interview ✓')}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation row when not answering */}
          {!isListening && !isEvaluating && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => {}}
                disabled={qIndex === 0}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-muted)] hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-muted)] hover:text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : (qIndex < totalQuestions - 1 ? 'Skip to Next' : 'Finish')} <ChevronRight size={14} />
              </button>
            </div>
          )}
          </>
        )}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-5">

          {/* Live Evaluation */}
          <div className="card p-6 overflow-hidden relative transition-all duration-400"
            style={{ borderColor: isEvaluating ? 'var(--theme-accent)' : 'var(--border)' }}>
            {isEvaluating && <div className="absolute inset-x-0 top-0 h-[2px] bg-[var(--theme-accent)] shadow-[0_4px_12px_var(--theme-accent)]" />}
            <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] mb-6 text-center">Live Evaluation</div>
            <div className="flex flex-col gap-7 mb-6">
              <ScoreGauge label="Technical" value={mockScore.tech} isEvaluating={isEvaluating} />
              <ScoreGauge label="Comms" value={mockScore.comms} isEvaluating={isEvaluating} />
            </div>
            <AnimatePresence mode="wait">
              {isEvaluating ? (
                <motion.div key="eval" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
                  className="bg-[#171D34] border border-[#2A3350] rounded-xl p-4 shadow-lg">
                  <span className="block text-[9px] uppercase tracking-widest text-[#F59E0B] font-bold mb-2">Incoming Feedback</span>
                  <span className="block text-[13px] font-medium leading-relaxed">Processing multi-modal analysis...</span>
                </motion.div>
              ) : (
                <motion.div key="prev" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
                  className="bg-[var(--elevated)] border border-[var(--border)] rounded-xl p-4">
                  <span className="block text-[9px] uppercase tracking-widest text-[#00D97E] font-bold mb-2">
                    {prevFeedback ? 'Previous Q Feedback' : 'Awaiting Answer'}
                  </span>
                  <span className="block text-[13px] font-medium leading-relaxed">
                    {prevFeedback ?? 'Answer the question to receive live feedback.'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>



        </div>
      </div>
    </motion.div>
  );
}
