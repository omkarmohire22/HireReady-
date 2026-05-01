'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic, MicOff, CheckCircle, ArrowRight, Volume2 } from 'lucide-react';

interface MicTestProps {
  onNext: () => void;
}

const C = {
  primary: '#6C47FF',
  success: '#00D97E',
  error: '#FF4D6A',
  warning: '#FFB547',
};

export default function MicTest({ onNext }: MicTestProps) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [volume, setVolume] = useState(0);
  const [bars, setBars] = useState<number[]>(new Array(20).fill(0));
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.98 };

  const stopTest = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    analyserRef.current = null;
    streamRef.current = null;
    setBars(new Array(20).fill(0));
    setVolume(0);
  };

  const startTest = async () => {
    setStatus('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArr = new Uint8Array(analyser.frequencyBinCount);

      const animate = () => {
        analyser.getByteFrequencyData(dataArr);
        const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
        setVolume(Math.round((avg / 255) * 100));
        setBars(Array.from(dataArr.slice(0, 20)).map(v => Math.max(4, (v / 255) * 100)));
        rafRef.current = requestAnimationFrame(animate);
      };
      animate();
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => () => stopTest(), []);

  const statusConfig = {
    idle:    { color: C.primary,  label: 'Click below to test your microphone', icon: Mic },
    testing: { color: C.success,  label: 'Microphone active — speak to test',   icon: Mic },
    ok:      { color: C.success,  label: 'Microphone is working perfectly!',    icon: CheckCircle },
    error:   { color: C.error,    label: 'Microphone access denied. Please enable it in your browser settings.', icon: MicOff },
  }[status];

  const volColor = volume < 20 ? C.warning : volume < 70 ? C.success : C.error;

  return (
    <div className="fade-up" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
        Microphone Check
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 36 }}>
        Let's make sure your audio is ready before the interview begins.
      </p>

      {/* Big mic orb */}
      <div style={{
        width: 140, height: 140, borderRadius: '50%', margin: '0 auto 32px',
        background: status === 'testing' || status === 'ok'
          ? `radial-gradient(circle, ${C.success}22, ${C.success}08)`
          : status === 'error'
          ? `radial-gradient(circle, ${C.error}22, ${C.error}08)`
          : 'var(--elevated)',
        border: `2px solid ${statusConfig.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: status === 'testing' ? `0 0 40px ${C.success}33` : 'none',
        transition: 'all 0.4s ease',
      }}>
        <statusConfig.icon size={52} color={statusConfig.color} />
      </div>

      {/* Waveform bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 60, marginBottom: 24 }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            width: 6, borderRadius: 3,
            background: status === 'testing' ? `linear-gradient(180deg, ${C.success}, ${C.primary})` : 'var(--elevated)',
            height: `${h}%`,
            transition: 'height 0.1s ease',
          }} />
        ))}
      </div>

      {/* Volume meter */}
      {status === 'testing' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span><Volume2 size={12} style={{ display: 'inline', marginRight: 4 }} />Input Level</span>
            <span style={{ color: volColor, fontWeight: 700 }}>{volume}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--elevated)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${volume}%`, background: volColor, borderRadius: 3, transition: 'width 0.1s ease', boxShadow: `0 0 8px ${volColor}66` }} />
          </div>
          {volume < 5 && <p style={{ fontSize: 12, color: C.warning, marginTop: 8 }}>🎙️ Speak louder — we can barely hear you</p>}
          {volume > 85 && <p style={{ fontSize: 12, color: C.error, marginTop: 8 }}>🔊 Too loud — move the mic a bit away</p>}
        </div>
      )}

      <p style={{ fontSize: 14, color: statusConfig.color, marginBottom: 24, fontWeight: 500 }}>
        {statusConfig.label}
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {status === 'idle' || status === 'error' ? (
          <motion.button
            className="btn-primary"
            style={{ padding: '12px 28px' }}
            onClick={startTest}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <Mic size={16} style={{ marginRight: 8 }} /> Test Microphone
          </motion.button>
        ) : (
          <motion.button
            className="btn-ghost"
            style={{ padding: '12px 20px' }}
            onClick={() => { stopTest(); setStatus('idle'); }}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            Retest
          </motion.button>
        )}
        <motion.button
          className="btn-primary"
          style={{ padding: '12px 28px', opacity: status === 'error' ? 0.5 : 1 }}
          onClick={onNext}
          disabled={status === 'error'}
          whileHover={status === 'error' ? undefined : hoverLift}
          whileTap={status === 'error' ? undefined : tapDown}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          Continue <ArrowRight size={15} style={{ marginLeft: 6 }} />
        </motion.button>
      </div>

      {status !== 'error' && (
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 16 }}>
          You can skip if your mic is already working.
        </p>
      )}
    </div>
  );
}
