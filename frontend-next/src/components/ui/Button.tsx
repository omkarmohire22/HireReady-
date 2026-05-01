'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type Props = {
  children: ReactNode;
  href?: string;
  variant?: 'primary' | 'ghost';
  className?: string;
};

export default function Button({ children, href = '#', variant = 'primary', className = '' }: Props) {
  const classes = variant === 'primary' ? 'primary-btn' : 'ghost-btn';
  const reduceMotion = useReducedMotion();
  const MotionLink = motion(Link);
  const hoverMotion = reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapMotion = reduceMotion ? undefined : { scale: 0.98 };
  return (
    <MotionLink
      href={href}
      className={`${classes} ${className}`}
      whileHover={hoverMotion}
      whileTap={tapMotion}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      {children}
    </MotionLink>
  );
}
