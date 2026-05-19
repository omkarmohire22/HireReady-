'use client';
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const C = {
  primary: '#6C47FF',
  accent:  '#00E5FF',
  success: '#00D97E',
  warning: '#FFB547',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
  primaryGlow: 'rgba(108,71,255,0.4)',
};

interface Stage {
  week: string;
  title: string;
  topics: string[];
  progress: number;
  color: string;
}

interface RoadmapData {
  target_role: string;
  total_progress: number;
  stages: Stage[];
}

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };

  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    
    let isMounted = true;
    api.getRoadmap(sessionId)
      .then(data => {
        if (isMounted) {
          setRoadmap(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Failed to load roadmap.');
          setLoading(false);
        }
      });
      
    return () => { isMounted = false; };
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-teal-400 mb-4" size={40} />
        <p style={{ color: 'var(--text-muted)' }}>Generating your personalized roadmap...</p>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ padding: 24, background: 'rgba(229,72,77,0.1)', border: '1px solid rgba(229,72,77,0.2)', borderRadius: 12 }}>
          <p style={{ color: 'var(--error)' }}>{error || 'Roadmap not found.'}</p>
          <button onClick={() => router.push('/dashboard')} style={{ marginTop: 16, padding: '8px 16px', background: 'var(--elevated)', color: 'var(--text)', borderRadius: 8 }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { stages, total_progress, target_role } = roadmap;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, letterSpacing: '-0.5px', marginBottom: 4 }}>
        Learning Roadmap
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Your personalised path for the <strong style={{ color: 'var(--text)' }}>{target_role}</strong> role.
      </p>

      {/* Progress banner */}
      <div className="card" style={{
        padding: 28, marginBottom: 40,
        background: `linear-gradient(135deg, ${C.primary}12, ${C.accent}08)`,
        border: `1px solid ${C.primary}22`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Overall Progress</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, letterSpacing: '-1px' }}>
              {total_progress}<span style={{ fontSize: 20, color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Weeks Done', val: stages.filter(s => s.progress === 100).length.toString() },
              { label: 'In Progress', val: stages.filter(s => s.progress > 0 && s.progress < 100).length.toString() },
              { label: 'Not Started', val: stages.filter(s => s.progress === 0).length.toString() },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--text)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--elevated)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${total_progress}%`, background: C.grad, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 12px ${C.primaryGlow}` }} />
        </div>
      </div>

      {/* Roadmap Items */}
      {stages.map((stage, i) => (
        <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
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
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{stage.title}</div>
              </div>
              <span style={{ background: `${stage.color}18`, color: stage.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                {stage.progress}%
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {stage.topics.map((topic, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <span style={{ color: stage.color, fontWeight: 'bold', fontSize: 14, userSelect: 'none' }}>•</span>
                  <span>{topic}</span>
                </div>
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
