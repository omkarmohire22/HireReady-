'use client';
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Upload, ArrowRight, Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { useInterviewSessionStore } from '@/lib/interviewSessionStore';

interface ResumeUploadProps {
  onNext: () => void;
}

export default function ResumeUpload({ onNext }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.98 };
  const token = useAuthStore(s => s.token);
  const session = useInterviewSessionStore(s => s.session);

  const handleUpload = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setRejected(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const detail = errData.detail || `Upload failed (${res.status})`;
        // 422 = validation rejection (not a resume)
        if (res.status === 422) {
          setRejected(true);
          setFile(null);
        }
        throw new Error(detail);
      }

      const data = await res.json();
      const skills: string[] = data?.data?.skills ?? [];
      setExtractedSkills(skills);

      setTimeout(() => {
        setAnalyzing(false);
        onNext();
      }, 800);
    } catch (err: unknown) {
      setAnalyzing(false);
      setError(err instanceof Error ? err.message : 'Upload failed. Is the backend running?');
    }
  };

  const handleSkip = () => {
    // When skipping, we proceed with no resume skills stored (backend will treat gaps as all skills)
    onNext();
  };

  return (
    <div className="fade-up">
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }} className="text-2xl md:text-3xl text-center mb-2 text-white">
        Upload Your Resume
      </h2>
      <p style={{ color: 'var(--text-muted)' }} className="text-center text-sm md:text-base mb-8">
        AI extracts your skills, experience, and education to personalize your session.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Upload Box */}
        <div className="card p-5 md:p-6">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
            Resume PDF
          </div>
          <div style={{ border: `2px dashed ${file ? '#00D97E' : 'var(--border-strong)'}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', background: file ? 'rgba(0, 217, 126, 0.05)' : 'transparent', transition: 'all 0.3s' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: file ? '#00D97E22' : 'rgba(108,71,255,0.1)', border: `1px solid ${file ? '#00D97E' : 'rgba(108,71,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              {file ? <FileText size={20} color="#00D97E" /> : <Upload size={20} color="#6C47FF" />}
            </div>
            
            {file ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4, color: '#00D97E' }}>{file.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Ready for analysis</div>
                <motion.button
                  className="btn-ghost"
                  onClick={() => { setFile(null); setError(null); setRejected(false); setExtractedSkills([]); }}
                  style={{ padding: '6px 14px', fontSize: 13 }}
                  whileHover={hoverLift}
                  whileTap={tapDown}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                >
                  Remove
                </motion.button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Drag &amp; drop your CV</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>PDF only · Max 5 MB</div>
                <motion.label
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: 14, cursor: 'pointer', display: 'inline-flex' }}
                  whileHover={hoverLift}
                  whileTap={tapDown}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                >
                  Browse Files
                  <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      setError(null);
                      setExtractedSkills([]);
                    }
                  }} />
                </motion.label>
              </>
            )}
          </div>
        </div>

        {/* Extraction Status Panel */}
        <div className="card p-5 md:p-6 flex flex-col items-center justify-center gap-3">
          <div style={{ color: 'var(--text-muted)', letterSpacing: 0.8 }} className="text-xs uppercase w-full mb-2">
            Extraction Engine
          </div>
          
          {analyzing ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C47FF', animation: `pulse 1s ${i*0.2}s infinite` }} />
                ))}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#6C47FF' }}>Parsing with AI NER…</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>spaCy + pdfminer extracting skills</p>
            </div>
          ) : rejected ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🚫</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#FF4D6A', marginBottom: 6 }}>Not a Resume</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {error || 'This document is not a CV or resume.'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 8 }}>
                Please upload your professional resume in PDF format.
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#FF4D6A' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Upload Failed</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{error}</p>
            </div>
          ) : extractedSkills.length > 0 ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={32} color="#00D97E" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#00D97E', marginBottom: 8 }}>
                {extractedSkills.length} skills extracted!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {extractedSkills.slice(0, 8).map(skill => (
                  <span key={skill} style={{ fontSize: 11, background: 'rgba(0,217,126,0.1)', border: '1px solid rgba(0,217,126,0.3)', color: '#00D97E', borderRadius: 20, padding: '2px 8px' }}>
                    {skill}
                  </span>
                ))}
                {extractedSkills.length > 8 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{extractedSkills.length - 8} more</span>
                )}
              </div>
            </div>
          ) : file ? (
            <div style={{ textAlign: 'center', color: '#00D97E' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>File accepted.</p>
              <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Click below to extract data.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', opacity: 0.4 }}>
              <Search size={40} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Upload a document to begin</p>
            </div>
          )}
        </div>
      </div>

      <motion.button
        className="btn-primary"
        onClick={handleUpload}
        disabled={!file || analyzing}
        style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: '14px' }}
        whileHover={!file || analyzing ? undefined : hoverLift}
        whileTap={!file || analyzing ? undefined : tapDown}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        {analyzing ? 'Extracting Data…' : 'Next: Set Up Role'} <ArrowRight size={16} />
      </motion.button>
      <motion.button
        onClick={handleSkip}
        style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', fontSize: 13, color: 'var(--text-subtle)', cursor: 'pointer', padding: '8px', textDecoration: 'underline' }}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        Skip — Use Demo Resume
      </motion.button>
    </div>
  );
}
