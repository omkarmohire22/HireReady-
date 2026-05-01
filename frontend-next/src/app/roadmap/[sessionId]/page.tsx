'use client';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useParams } from 'next/navigation';

const C = {
  primary: '#6C47FF',
  accent:  '#00E5FF',
  success: '#00D97E',
  warning: '#FFB547',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
  primaryGlow: 'rgba(108,71,255,0.4)',
};

export default function RoadmapPage() {
  const params = useParams();
  const sessionId = params?.sessionId || 'demo123';
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };

  const stages = [
    {
      week: 'Week 1–2',
      title: 'Data Structures Fundamentals',
      topics: ['Arrays & Strings', 'Trees & Graphs', 'Hash Maps'],
      progress: 80,
      color: C.success,
    },
    {
      week: 'Week 3–4',
      title: 'System Design Basics',
      topics: ['Load Balancing', 'Caching Strategies', 'Database Design'],
      progress: 45,
      color: C.warning,
    },
    {
      week: 'Week 5–6',
      title: 'Communication & Behavioural',
      topics: ['STAR Method', 'Conflict Resolution', 'Leadership Stories'],
      progress: 20,
      color: C.primary,
    },
    {
      week: 'Week 7–8',
      title: 'Mock Interview Sprints',
      topics: ['FAANG Simulations', 'Timed Practice', 'Feedback Review'],
      progress: 0,
      color: C.accent,
    },
  ];

  const totalPct = Math.round(stages.reduce((a, s) => a + s.progress, 0) / stages.length);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.3s ease' }} data-aos="fade-up">
      <h1 className="fade-up" data-aos="fade-up" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-1px', marginBottom: 8 }}>
        Learning Roadmap
      </h1>
      <p className="fade-up-1" data-aos="fade-up" data-aos-delay={80} style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Your personalised path to becoming interview-ready.
      </p>

      {/* Progress banner */}
      <div className="card fade-up-2" data-aos="fade-up" data-aos-delay={120} style={{
        padding: 28, marginBottom: 40,
        background: `linear-gradient(135deg, ${C.primary}12, ${C.accent}08)`,
        border: `1px solid ${C.primary}22`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Overall Progress</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 48, letterSpacing: '-2px' }}>
              {totalPct}<span style={{ fontSize: 20, color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Weeks Done', val: stages.filter(s => s.progress === 100).length.toString() },
              { label: 'In Progress', val: stages.filter(s => s.progress > 0 && s.progress < 100).length.toString() },
              { label: 'Not Started', val: stages.filter(s => s.progress === 0).length.toString() },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--elevated)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalPct}%`, background: C.grad, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 12px ${C.primaryGlow}` }} />
        </div>
      </div>

      {/* Roadmap Items */}
      {stages.map((stage, i) => (
        <div key={i} className={`fade-up-${i + 2}`} data-aos="fade-up" data-aos-delay={140 + i * 80} style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
          {/* Left column: step circle + line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: stage.progress > 0 ? `${stage.color}22` : 'var(--elevated)',
              border: `2px solid ${stage.progress > 0 ? stage.color : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {stage.progress === 100
                ? <CheckCircle size={18} color={stage.color} />
                : <span style={{ fontSize: 14, fontWeight: 700, color: stage.progress > 0 ? stage.color : 'var(--text-muted)' }}>{i + 1}</span>
              }
            </div>
            {i < stages.length - 1 && (
              <div style={{ width: 2, flex: 1, minHeight: 40, background: `linear-gradient(180deg, ${stage.color}66, transparent)`, marginTop: 8 }} />
            )}
          </div>

          {/* Card */}
          <motion.div
            className="card"
            style={{ flex: 1, padding: 24, marginBottom: 0 }}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: stage.color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{stage.week}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>{stage.title}</div>
              </div>
              <span style={{ background: `${stage.color}18`, color: stage.color, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {stage.progress}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {stage.topics.map(topic => (
                <span key={topic} style={{ background: 'var(--elevated)', color: 'var(--text-muted)', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>
                  {topic}
                </span>
              ))}
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--elevated)' }}>
              <div style={{
                height: '100%', width: `${stage.progress}%`, borderRadius: 2,
                background: stage.color, transition: 'width 1s ease',
                boxShadow: stage.progress > 0 ? `0 0 8px ${stage.color}66` : 'none',
              }} />
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

