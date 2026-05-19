'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Code2, Layers, Activity, Target, Play, ShieldAlert, Loader2, AlertCircle, Brain, Server, Terminal } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { useInterviewSessionStore } from '@/lib/interviewSessionStore';

interface SkillAlignmentProps {
  onNext: () => void;
  onBack: () => void;
}

const ROLES = [
  { role: 'Frontend Developer', icon: Code2 },
  { role: 'Backend Engineer',   icon: Layers },
  { role: 'Full Stack Dev',     icon: Activity },
  { role: 'System Design',      icon: Target },
  { role: 'ML Engineer',        icon: Brain },
  { role: 'DevOps Engineer',    icon: Server },
];

const DIFFICULTIES = [
  { label: 'Easy',   value: 'Easy',   color: '#00D97E', desc: 'Fundamentals & concepts' },
  { label: 'Medium', value: 'Medium', color: '#FFB547', desc: 'Applied problems' },
  { label: 'Hard',   value: 'Hard',   color: '#FF4D6A', desc: 'FAANG-level depth' },
];

const INTERVIEW_TYPES = [
  { label: 'Technical',     value: 'technical',     icon: Terminal },
  { label: 'Behavioural',   value: 'behavioural',   icon: Brain },
  { label: 'System Design', value: 'system_design', icon: Layers },
];

const C = { primary: '#6C47FF', border: 'var(--border)' };

interface MatchResult {
  overall_match_score: number;
  matched_skills: { skill: string; score: number }[];
  missing_skills: string[];
  note?: string;
}

export default function SkillAlignment({ onNext, onBack }: SkillAlignmentProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedType, setSelectedType] = useState('technical');

  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.98 };

  const token = useAuthStore(s => s.token);
  const startSession = useInterviewSessionStore(s => s.startSession);

  // ── Fetch real skill gap whenever role changes ──────────────────────────────
  const fetchMatch = useCallback(async (role: string) => {
    setMatchLoading(true);
    setMatchError(null);
    setMatchResult(null);
    try {
      // Mock match since we didn't migrate resume/match yet, or use the real one if it exists
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/backend";
      const res = await fetch(`${BASE_URL}/resume/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ target_role: role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Match failed (${res.status})`);
      }
      const data: MatchResult = await res.json();
      setMatchResult(data);
    } catch (err: unknown) {
      setMatchError(err instanceof Error ? err.message : 'Skill match failed.');
    } finally {
      setMatchLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedRole) fetchMatch(selectedRole);
  }, [selectedRole, fetchMatch]);

  // ── Start interview session ─────────────────────────────────────────────────
  const handleBegin = async () => {
    if (!selectedRole) return;
    setStarting(true);
    try {
      const rawMissing = matchResult?.missing_skills ?? [];
      const missingSkills = rawMissing.map(s => typeof s === 'string' ? s : (s as any).skill);
      const { api } = await import('@/lib/api');
      
      const sessionData = await api.startSession({
        target_role: selectedRole,
        session_type: selectedType,
        difficulty: selectedDifficulty,
        missing_skills: missingSkills.length > 0 ? missingSkills : undefined,
      });

      // Initialise Zustand store with the real session
      startSession({
        id: sessionData._id || sessionData.id || sessionData.session_id || 'demo',
        resumeId: '',
        role: selectedRole,
        resumeSkills: [],
        missingSkills: missingSkills,
        questions: [],   // Questions will be fetched dynamically inside InterviewPanel
      });

      onNext();
    } catch (err: unknown) {
      setMatchError(err instanceof Error ? err.message : 'Could not start session.');
      setStarting(false);
    }
  };

  const matchPct = matchResult?.overall_match_score ?? null;
  const hasMinSkills = matchPct === null || matchPct >= 30;
  const canProceed = !!selectedRole && !matchLoading && !starting && hasMinSkills;
  
  const matchColor = matchPct !== null
    ? (matchPct >= 80 ? '#00D97E' : matchPct >= 30 ? '#FFB547' : '#FF4D6A')
    : '#6C47FF';

  return (
    <div className="fade-up space-y-6">
      <div className="text-center">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }} className="text-2xl md:text-3xl mb-2 text-white">
          Role &amp; Skill Alignment
        </h2>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm md:text-base">
          Configure your interview session before starting.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontWeight: 600 }}>
          Select Target Role
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLES.map(r => {
            const isSelected = selectedRole === r.role;
            return (
              <motion.div
                key={r.role}
                className="card"
                onClick={() => {
                  setSelectedRole(r.role);
                  setCustomRole('');
                }}
                style={{
                  padding: 16, cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: isSelected ? C.primary : 'var(--border)',
                  background: isSelected ? 'rgba(108,71,255,0.08)' : 'var(--card-bg)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                }}
                whileHover={hoverLift}
                whileTap={tapDown}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(108,71,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <r.icon size={16} color={C.primary} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.role}</span>
                  {isSelected && matchPct !== null && (
                    <div style={{ marginLeft: 'auto', background: `${matchColor}22`, border: `1px solid ${matchColor}44`, color: matchColor, padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                      {matchPct}%
                    </div>
                  )}
                </div>
                {/* Match bar — only show for selected role */}
                {isSelected && matchPct !== null && (
                  <div style={{ height: 3, background: 'var(--elevated)', borderRadius: 2, marginTop: 10 }}>
                    <div style={{ height: '100%', width: `${matchPct}%`, background: matchColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        {/* Custom Role Input */}
        <div style={{ marginTop: 12 }}>
          <input 
            type="text" 
            placeholder="Or type a custom role (e.g., Blockchain Developer)"
            value={customRole}
            onChange={(e) => {
              setCustomRole(e.target.value);
              setSelectedRole(e.target.value);
            }}
            onFocus={() => {
              if (customRole) setSelectedRole(customRole);
            }}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
              background: 'var(--card-bg)', border: `1px solid ${selectedRole === customRole && customRole ? C.primary : 'var(--border)'}`,
              color: 'var(--text-high)', outline: 'none', transition: 'border-color 0.2s'
            }}
          />
        </div>
      </div>

      {/* Difficulty & Type Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Difficulty */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>
            Difficulty Level
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFICULTIES.map(d => {
              const isActive = selectedDifficulty === d.value;
              return (
                <motion.button
                  key={d.value}
                  onClick={() => setSelectedDifficulty(d.value)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: 10, border: `1px solid ${isActive ? d.color + '66' : 'var(--border)'}`,
                    background: isActive ? `${d.color}15` : 'var(--card-bg)',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                  }}
                  whileHover={hoverLift}
                  whileTap={tapDown}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? d.color : 'var(--text-muted)' }}>{d.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>{d.desc}</div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Interview Type */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>
            Interview Type
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {INTERVIEW_TYPES.map(t => {
              const isActive = selectedType === t.value;
              return (
                <motion.button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  style={{
                    flex: 1, padding: '12px 6px', borderRadius: 10, border: `1px solid ${isActive ? C.primary + '66' : 'var(--border)'}`,
                    background: isActive ? 'rgba(108,71,255,0.1)' : 'var(--card-bg)',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}
                  whileHover={hoverLift}
                  whileTap={tapDown}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                >
                  <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
                    <t.icon size={20} color={isActive ? C.primary : 'var(--text-muted)'} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 11, color: isActive ? C.primary : 'var(--text-muted)' }}>{t.label}</div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gap Analysis Box */}
      {selectedRole && (
        <div className="card fade-up" style={{ padding: 20, borderLeft: `4px solid ${matchColor}`, background: `${matchColor}08` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ShieldAlert size={16} color={matchColor} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>
              Skill Gap Analysis for {selectedRole}
            </h3>
          </div>

          {matchLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Analysing your resume against role requirements…
            </div>
          ) : matchError ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FF4D6A', fontSize: 13 }}>
              <AlertCircle size={14} />
              {matchError} — showing default gap.
            </div>
          ) : matchResult ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Your resume matches <strong style={{ color: matchColor }}>{matchResult.overall_match_score}%</strong> of {selectedRole} requirements.
                AI will focus on the <strong style={{ color: '#FFB547' }}>{matchResult.missing_skills.length}</strong> identified gaps during this <strong style={{ color: '#FFB547' }}>{selectedDifficulty.toLowerCase()}</strong> session.
              </p>
              {matchResult.note && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, opacity: 0.7 }}>{matchResult.note}</p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {matchResult.missing_skills.map((skill, index) => {
                  const skillName = typeof skill === 'string' ? skill : (skill as any).skill;
                  return (
                    <span key={`${skillName}-${index}`} style={{ fontSize: 12, fontWeight: 500, background: 'var(--elevated)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20, color: 'var(--text-muted)' }}>
                      {skillName}
                    </span>
                  );
                })}
              </div>
              {!hasMinSkills && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FF4D6A', fontSize: 13, marginTop: 12, padding: '10px 12px', background: 'rgba(255,77,106,0.1)', borderRadius: 8, border: '1px solid rgba(255,77,106,0.2)' }}>
                  <AlertCircle size={14} />
                  Your skill match is below 30%. Please select a different role or upload a more relevant resume.
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          className="btn-ghost flex-1 py-3 px-4"
          onClick={onBack}
          whileHover={hoverLift}
          whileTap={tapDown}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          ← Back
        </motion.button>
        <motion.button
          className="btn-primary flex-[2] py-3 px-4 flex justify-center items-center gap-2"
          onClick={handleBegin}
          disabled={!canProceed}
          whileHover={!canProceed ? undefined : hoverLift}
          whileTap={!canProceed ? undefined : tapDown}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {starting ? (
            <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Starting…</>
          ) : (
            <>Begin {canProceed ? `${selectedRole}` : 'Interview'} <Play size={15} /></>
          )}
        </motion.button>
      </div>
    </div>
  );
}
