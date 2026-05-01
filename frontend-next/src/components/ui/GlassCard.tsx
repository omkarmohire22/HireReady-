'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  const hoverMotion = reduceMotion ? undefined : { y: -3, boxShadow: '0 16px 40px rgba(0,0,0,0.25)' };
  return (
    <motion.div
      className={`glass-card ${className}`}
      whileHover={hoverMotion}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
