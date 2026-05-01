'use client';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ReportDashboard from '@/components/ReportDashboard';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BarChart3 } from 'lucide-react';

const C = { primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E' };

export default function ReportPage() {
  const params = useParams();
  const sessionId = params?.sessionId || 'demo123';
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };
  const MotionLink = motion(Link);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }} data-aos="fade-up">
      <ReportDashboard />

      {/* Communication Deep Dive CTA */}
      <motion.div
        className="card mt-6"
        data-aos="fade-up"
        data-aos-delay={120}
        style={{
          padding: 24,
          background: `linear-gradient(135deg, ${C.accent}10, ${C.primary}08)`,
          border: `1px solid ${C.accent}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={20} color={C.accent} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Communication Deep Dive</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>See WPM, filler word breakdown, pace chart & per-question audio analysis.</div>
          </div>
        </div>
        <MotionLink
          href={`/communication-report/${sessionId}`}
          className="btn-ghost"
          style={{ padding: '10px 20px', fontSize: 14, color: C.accent, borderColor: `${C.accent}44`, whiteSpace: 'nowrap' }}
          whileHover={hoverLift}
          whileTap={tapDown}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          View Communication Report →
        </MotionLink>
      </motion.div>
    </div>
  );
}
