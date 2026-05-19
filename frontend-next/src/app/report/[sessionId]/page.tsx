'use client';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ReportDashboard from '@/components/ReportDashboard';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BarChart3 } from 'lucide-react';

const C = { primary: 'var(--teal)', accent: 'var(--purple)', success: 'var(--teal)' };

export default function ReportPage() {
  const params = useParams();
  const sessionId = params?.sessionId || 'demo123';
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };
  const MotionLink = motion(Link);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }} data-aos="fade-up">
      <ReportDashboard sessionId={sessionId} />

      {/* Communication Deep Dive CTA */}
      <motion.div
        className="card mt-6"
        data-aos="fade-up"
        data-aos-delay={120}
        style={{
          padding: '18px 22px',
          background: 'var(--teal-dim)',
          border: '1px solid rgba(29,158,117,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={18} color="var(--teal)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, marginBottom: 2, letterSpacing: '-0.02em' }}>Communication Deep Dive</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>WPM, filler words, pace chart & per-question audio analysis.</div>
          </div>
        </div>
        <MotionLink
          href={`/communication-report/${sessionId}`}
          className="btn-ghost"
          style={{ padding: '8px 18px', fontSize: 13.5, color: 'var(--teal)', borderColor: 'rgba(29,158,117,0.35)', whiteSpace: 'nowrap' }}
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
