'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

const C = {
  primary: '#6C47FF',
  accent: '#00E5FF',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#________';

function GlitchText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState(text);

  useEffect(() => {
    let frame = 0;
    const total = 18;
    const interval = setInterval(() => {
      frame++;
      setDisplayed(
        text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' ';
            if (frame > i * (total / text.length)) return char;
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          })
          .join('')
      );
      if (frame >= total) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
}

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.primary}18 0%, transparent 70%)`,
          top: '10%',
          left: '20%',
          animation: 'blobMove1 12s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accent}12 0%, transparent 70%)`,
          bottom: '15%',
          right: '15%',
          animation: 'blobMove2 14s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 560,
          animation: 'fadeUp 0.5s ease both',
        }}
      >
        {/* 404 Big Number */}
        <div
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(100px, 20vw, 160px)',
            lineHeight: 1,
            letterSpacing: '-6px',
            background: C.grad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 8,
            userSelect: 'none',
          }}
        >
          404
        </div>

        {/* Glitch subtitle */}
        <div
          style={{
            fontFamily: 'DM Sans, monospace',
            fontSize: 13,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: C.primary,
            marginBottom: 28,
            fontWeight: 600,
          }}
        >
          {mounted ? <GlitchText text="PAGE NOT FOUND" /> : 'PAGE NOT FOUND'}
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            padding: '36px 40px',
            border: `1px solid ${C.primary}22`,
            background: `linear-gradient(135deg, ${C.primary}08, ${C.accent}05)`,
            marginBottom: 32,
          }}
        >
          {/* Search icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `${C.primary}18`,
              border: `1px solid ${C.primary}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Search size={24} color={C.primary} />
          </div>

          <h1
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 12,
              letterSpacing: '-0.5px',
            }}
          >
            Oops! Wrong turn.
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 15,
              lineHeight: 1.7,
              marginBottom: 0,
            }}
          >
            The page you're looking for doesn't exist or has been moved.
            <br />
            Head back to continue your interview prep.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/dashboard"
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: 15, textDecoration: 'none' }}
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
          <button
            className="btn-ghost"
            style={{ padding: '12px 24px', fontSize: 15 }}
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Footer hint */}
        <p
          style={{
            marginTop: 40,
            fontSize: 12,
            color: 'var(--text-subtle)',
            letterSpacing: 0.3,
          }}
        >
          If you think this is a bug,{' '}
          <Link
            href="/"
            style={{ color: C.primary, textDecoration: 'none' }}
          >
            let us know
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
