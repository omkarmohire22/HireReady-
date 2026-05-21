'use client';
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FileText, CheckCircle2, AlertTriangle, ShieldCheck,
  ChevronRight, Loader2, Sparkles, Target, ArrowRight, Play, RefreshCw,
  Edit, Check, X, Wand2, ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';

const C = {
  primary: 'var(--teal)',
  accent:  'var(--purple)',
  success: 'var(--teal)',
  warning: 'var(--amber)',
  error:   '#FF4D6A',
  grad:    'var(--grad)',
  cardBg:  'var(--card-bg)',
  elevated: 'var(--elevated)',
  border:   'var(--border)',
};

const CircleMatchProgress = ({ value, size = 100, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  
  const color = value >= 75 ? C.success : value >= 50 ? C.warning : C.error;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 5px ${color}44)` }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: size * 0.22, color: 'var(--text-high)' }}>
          {Math.round(value)}%
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>
          Match
        </div>
      </div>
    </div>
  );
};

export default function ResumeAnalyzerPage() {
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -2, scale: 1.01 };

  // Profile and active state
  const [user, setUser] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Matching configs
  const [matchMode, setMatchMode] = useState<'preset' | 'custom'>('preset');
  const [selectedRole, setSelectedRole] = useState('Full Stack Dev');
  const [customJobDesc, setCustomJobDesc] = useState('');
  
  const [matchData, setMatchData] = useState<any>(null);
  const [matching, setMatching] = useState(false);

  // Delta score pops
  const [deltaBadge, setDeltaBadge] = useState<string | null>(null);

  // Editor configs
  const [editorSection, setEditorSection] = useState<'Summary' | 'Experience' | 'Projects' | 'Skills'>('Summary');
  const [sectionText, setSectionText] = useState('');
  const [proposalBullets, setProposalBullets] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [optSuccess, setOptSuccess] = useState(false);

  // Populate default sections dynamically without fabricating default placeholder text
  useEffect(() => {
    if (editorSection === 'Summary') {
      setSectionText(user?.summary || "");
    } else if (editorSection === 'Experience') {
      setSectionText(user?.experience || "");
    } else if (editorSection === 'Projects') {
      setSectionText(user?.projects || "");
    } else {
      setSectionText(skills.join(", "));
    }
    setProposalBullets([]);
    setOptSuccess(false);
  }, [editorSection, user, skills]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await api.getMe();
      setUser(userData);
      setSkills(userData.resume_skills || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active resume details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const runMatchCalculation = async (silentSkillsList?: string[]) => {
    const activeSkills = silentSkillsList || skills;
    if (activeSkills.length === 0) {
      setMatchData(null);
      return;
    }

    if (!silentSkillsList) setMatching(true);
    try {
      const payload: any = {};
      if (matchMode === 'custom') {
        if (!customJobDesc.trim()) {
          setMatching(false);
          return;
        }
        payload.job_description = customJobDesc;
      } else {
        payload.target_role = selectedRole;
      }

      const data = await api.matchSkills(payload);
      
      // Track match improvement live!
      if (matchData && data.overall_match_score > matchData.overall_match_score) {
        const diff = data.overall_match_score - matchData.overall_match_score;
        setDeltaBadge(`+${diff.toFixed(1)}% ↑ Match Increase!`);
        setTimeout(() => setDeltaBadge(null), 5000);
      }
      
      setMatchData(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silentSkillsList) setMatching(false);
    }
  };

  // Auto-run presets
  useEffect(() => {
    if (matchMode === 'preset') {
      runMatchCalculation();
    }
  }, [skills, selectedRole, matchMode]);

  // Propose optimizations using FastAPI backend /edit endpoint
  const handleProposeOptimization = async () => {
    if (!matchData) {
      alert('Please run an AI skills match first to determine technical gaps!');
      return;
    }

    const gaps = matchData.missing_skills?.map((g: any) => g.skill) || [];
    if (gaps.length === 0) {
      alert("Congratulations! Zero skill gaps identified. No optimization needed!");
      return;
    }

    setOptimizing(true);
    setOptSuccess(false);
    try {
      const data = await api.editResumeSection({
        section: editorSection,
        section_text: sectionText,
        target_role: selectedRole,
        skill_gaps: gaps.slice(0, 3) // Target the top 3 gaps!
      });

      const lines = data.rewritten_text.split('\n').map((l: string) => l.trim().replace(/^[•\s*-]+/g, '')).filter((l: string) => l);
      setProposalBullets(lines);
      setOptSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setOptimizing(false);
    }
  };

  // Accept single optimized bullet
  const handleAcceptBullet = (bullet: string) => {
    if (editorSection === 'Summary' || editorSection === 'Skills') {
      setSectionText(bullet);
      setProposalBullets(prev => prev.filter(b => b !== bullet));
    } else {
      const cleanBullet = bullet.replace(/^[•\s*-]+/g, '').trim();
      setSectionText(prev => {
        const lines = prev.split('\n').map(l => l.trim()).filter(l => l);
        const exists = lines.some(l => l.toLowerCase().includes(cleanBullet.toLowerCase()));
        if (exists) return prev;
        return `• ${cleanBullet}\n${prev}`;
      });
      setProposalBullets(prev => prev.filter(b => b !== bullet));
    }
  };

  // Commit optimizations to profile directory & rematch score!
  const handleApplySectionChanges = async () => {
    const gaps = matchData.missing_skills?.map((g: any) => g.skill) || [];
    const addedSkills = gaps.slice(0, 3);
    
    const newSkillsList = [...skills];
    addedSkills.forEach((s: string) => {
      if (!newSkillsList.some(ex => ex.toLowerCase() === s.toLowerCase())) {
        newSkillsList.push(s);
      }
    });

    try {
      await api.updateMe({
        name: user.name,
        role: user.role,
        resume_skills: newSkillsList
      });

      setSkills(newSkillsList);
      await runMatchCalculation(newSkillsList);
      setProposalBullets([]);
      setOptSuccess(false);
      alert("Resume skills successfully updated and match score recalculated!");
    } catch (err: any) {
      alert("Failed to commit optimizations to profile database.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading AI resume analysis hub...</p>
      </div>
    );
  }

  const hasSkills = skills.length > 0;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Floating Score delta popup */}
      {deltaBadge && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          background: C.grad, color: '#fff', padding: '14px 20px',
          borderRadius: 12, boxShadow: '0 8px 30px rgba(108,71,255,0.4)',
          display: 'flex', alignItems: 'center', gap: 10, animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <Sparkles size={18} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5 }}>{deltaBadge}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Resume skills synchronized!</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="fade-up mb-6">
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6, fontWeight: 600 }}>Optimize Hub</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em', marginBottom: 4 }}>AI Resume & Skill Gap Matcher</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Analyze your CV against career tiers using semantic models and instantly resolve technical alignment gaps.</p>
      </div>

      {!hasSkills ? (
        /* Empty State Guide - Redundancy Purged */
        <div style={{ padding: '60px 40px', background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center', maxWidth: 680, margin: '40px auto' }}>
          <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 16px', color: 'var(--text-muted)' }} />
          <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)' }}>No Active Resume Registered</h3>
          <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Please upload your technical CV PDF under the <strong>Profile Page</strong> to extract your skills directory. Once uploaded, return here to unlock the dynamic AI Gap Optimizer workspace!
          </p>
          <a
            href="/profile"
            className="btn"
            style={{
              background: C.grad,
              border: 'none',
              color: '#fff',
              padding: '10px 24px',
              fontSize: 13.5,
              fontWeight: 700,
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none'
            }}
          >
            Go to Profile Page <ArrowRight size={14} />
          </a>
        </div>
      ) : (
        /* BALANCED SIDE-BY-SIDE DOUBLE-COLUMN PREMIUM WORKSPACE Layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
          
          {/* COLUMN 1: AI Competency Matcher (Analysis) */}
          <div className="flex flex-col gap-6">
            <motion.div
              className="card p-6"
              whileHover={hoverLift}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {/* Preset vs Custom Selectors */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--elevated)', padding: 4, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16, width: 'fit-content' }}>
                <button
                  onClick={() => setMatchMode('preset')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: matchMode === 'preset' ? 'var(--card-bg)' : 'transparent',
                    color: matchMode === 'preset' ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Roles Matcher
                </button>
                <button
                  onClick={() => setMatchMode('custom')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: matchMode === 'custom' ? 'var(--card-bg)' : 'transparent',
                    color: matchMode === 'custom' ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Live Job Description Parser
                </button>
              </div>

              {/* Selector Headers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', margin: '0 0 2px' }}>
                    {matchMode === 'preset' ? 'Target Competency Alignment' : 'Job Description Alignment'}
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--text-subtle)', margin: 0 }}>
                    {matchMode === 'preset' ? 'Select tier to calculate semantic match' : 'Paste any live job post description below'}
                  </p>
                </div>

                {matchMode === 'preset' && (
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: 12,
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="Full Stack Dev">Full Stack Developer</option>
                    <option value="System Design">System Architect</option>
                    <option value="ML Engineer">Machine Learning Engineer</option>
                    <option value="DevOps Engineer">DevOps & Cloud Engineer</option>
                    <option value="Data Analyst">Data Analyst</option>
                  </select>
                )}
              </div>

              {/* Custom Job Post input */}
              {matchMode === 'custom' && (
                <div style={{ marginBottom: 18 }}>
                  <textarea
                    value={customJobDesc}
                    onChange={e => setCustomJobDesc(e.target.value)}
                    placeholder="Paste details of a live job listing here (e.g. 'Looking for a Python Backend developer with experience in FastAPI, Docker, and PostgreSQL...')"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: 12.5,
                      outline: 'none',
                      lineHeight: 1.5,
                      marginBottom: 8,
                      resize: 'none'
                    }}
                  />
                  <button
                    onClick={() => runMatchCalculation()}
                    disabled={matching || !customJobDesc.trim()}
                    className="btn"
                    style={{
                      background: C.grad,
                      border: 'none',
                      color: '#fff',
                      padding: '8px 18px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {matching ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
                    {matching ? 'Analyzing JD...' : 'Analyze Custom JD'}
                  </button>
                </div>
              )}

              {/* Results metrics */}
              {matching ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 220, gap: 12 }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: C.accent }} />
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Calculating semantic matching deltas…</span>
                </div>
              ) : matchData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                  {/* Score row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 18px', background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <CircleMatchProgress value={matchData.overall_match_score || 0} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text-high)', marginBottom: 2 }}>
                        AI Alignment Score
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {matchData.overall_match_score >= 75
                          ? 'Outstanding stack overlap. Your profile matches target role specifications perfectly.'
                          : matchData.overall_match_score >= 50
                          ? 'Good baseline fit. Use the AI Copilot on the right to resolve missing skills.'
                          : 'Significant gap found. Focus on bridging critical gaps before applying.'}
                      </p>
                    </div>
                  </div>

                  {/* Skills lists */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Matched */}
                    <div>
                      <h4 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 8px' }}>
                        <CheckCircle2 size={13} /> Verified Competencies ({matchData.matched_skills?.length || 0})
                      </h4>
                      {(!matchData.matched_skills || matchData.matched_skills.length === 0) ? (
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>No matches registered yet.</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {matchData.matched_skills.map((item: any) => (
                            <span
                              key={item.skill}
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                background: 'rgba(29,158,117,0.06)',
                                border: '1px solid rgba(29,158,117,0.2)',
                                color: 'var(--teal)',
                                borderRadius: 5,
                                fontWeight: 600
                              }}
                            >
                              {item.skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Gaps */}
                    <div>
                      <h4 style={{ fontSize: 12.5, fontWeight: 700, color: '#FF4D6A', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 8px' }}>
                        <AlertTriangle size={13} /> Skill Gaps Identified ({matchData.missing_skills?.length || 0})
                      </h4>
                      {(!matchData.missing_skills || matchData.missing_skills.length === 0) ? (
                        <span style={{ fontSize: 11.5, color: 'var(--teal)', fontWeight: 600 }}>✓ Flawless overlap! 0 Gaps found!</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {matchData.missing_skills.map((item: any) => (
                            <div
                              key={item.skill}
                              style={{
                                padding: '8px 10px',
                                background: 'rgba(255,77,106,0.03)',
                                border: '1px solid rgba(255,77,106,0.14)',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)' }}>{item.skill}</span>
                                <span style={{ fontSize: 8.5, background: item.priority === 'Critical' ? 'rgba(255,77,106,0.12)' : 'rgba(255,255,255,0.04)', color: item.priority === 'Critical' ? '#FF4D6A' : 'var(--text-subtle)', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>
                                  {item.priority}
                                </span>
                              </div>
                              <a href={item.resource?.url} target="_blank" rel="noreferrer" style={{ color: C.accent, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600 }}>
                                Guide <ExternalLink size={9} />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bridge practices */}
                  {matchData.missing_skills?.length > 0 && (
                    <div style={{ padding: '12px 14px', background: 'var(--teal-dim)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        Launch mock session to bridge these gaps.
                      </div>
                      <a href="/practice" className="btn" style={{ background: C.grad, border: 'none', color: '#fff', padding: '6px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        <Play size={10} fill="#fff" /> Practice
                      </a>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 220, opacity: 0.5 }}>
                  <Wand2 size={24} style={{ marginBottom: 6 }} />
                  <span style={{ fontSize: 12.5 }}>Select target parameters to analyze alignment.</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* COLUMN 2: AI Resume Copilot & Optimizer (Actionable Editor Workspace) */}
          <div className="flex flex-col gap-6">
            <motion.div
              className="card p-6"
              whileHover={hoverLift}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {/* Header and Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(108,71,255,0.08)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit size={14} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', margin: 0 }}>AI Resume Copilot</h3>
                </div>

                <div style={{ background: 'rgba(108,71,255,0.06)', border: '1px solid rgba(108,71,255,0.14)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                  Active CV Rewrite
                </div>
              </div>

              {/* Section Tabs */}
              <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {(['Summary', 'Experience', 'Projects', 'Skills'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setEditorSection(tab)}
                    style={{
                      padding: '6px 10px',
                      background: editorSection === tab ? 'var(--elevated)' : 'transparent',
                      border: '1px solid',
                      borderColor: editorSection === tab ? 'var(--border)' : 'transparent',
                      color: editorSection === tab ? 'var(--text-high)' : 'var(--text-muted)',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Split screen elements */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                
                {/* Editor Textarea */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Original Wording</span>
                  <textarea
                    value={sectionText}
                    onChange={e => setSectionText(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 8,
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: 12,
                      outline: 'none',
                      lineHeight: 1.5,
                      fontFamily: 'monospace'
                    }}
                  />
                  
                  <button
                    onClick={handleProposeOptimization}
                    disabled={optimizing}
                    className="btn"
                    style={{
                      background: C.grad,
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    {optimizing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={12} />}
                    {optimizing ? 'Proposing...' : `Optimize ${editorSection}`}
                  </button>
                </div>

                {/* Proposals listing with highlight diffs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Proposals Comparison</span>
                  
                  <div
                    style={{
                      flex: 1,
                      minHeight: 120,
                      padding: '10px',
                      borderRadius: 8,
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      maxHeight: 200,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      width: '100%'
                    }}
                  >
                    {!optSuccess && !optimizing ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, textAlign: 'center', padding: 10 }}>
                        <Wand2 size={20} style={{ marginBottom: 4 }} />
                        <span style={{ fontSize: 11.5 }}>Click Optimize to generate suggestions.</span>
                      </div>
                    ) : optimizing ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: C.accent }} />
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Integrating technical gaps...</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                        {proposalBullets.length === 0 ? (
                          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)' }}>
                            All recommendations successfully processed!
                          </div>
                        ) : (
                          proposalBullets.map((bullet, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '10px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                width: '100%',
                                maxWidth: '100%',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Word level highlighting with strict wrapping */}
                              <div style={{ 
                                fontSize: 12, 
                                lineHeight: 1.5, 
                                color: 'var(--text)', 
                                whiteSpace: 'normal', 
                                wordBreak: 'break-word', 
                                overflowWrap: 'anywhere',
                                width: '100%' 
                              }}>
                                {bullet.split(" ").map((w, wIdx) => {
                                  const clean = w.replace(/[.,:;()]/g, "").toLowerCase();
                                  const isG = matchData.missing_skills?.some((g: any) => g.skill.toLowerCase() === clean);
                                  return (
                                    <span
                                      key={wIdx}
                                      style={{
                                        background: isG ? 'rgba(0,217,126,0.12)' : 'transparent',
                                        color: isG ? 'var(--teal)' : 'var(--text)',
                                        fontWeight: isG ? 700 : 'normal',
                                        borderRadius: 3,
                                        padding: isG ? '0 2px' : 0,
                                        marginRight: 3,
                                        display: 'inline-block'
                                      }}
                                    >
                                      {w}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Operations */}
                              <div style={{ display: 'flex', gap: 4, width: '100%', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setProposalBullets(prev => prev.filter(b => b !== bullet))}
                                  style={{
                                    padding: '3px 8px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,77,106,0.2)',
                                    color: '#FF4D6A',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                  }}
                                >
                                  <X size={9} /> Skip
                                </button>
                                <button
                                  onClick={() => handleAcceptBullet(bullet)}
                                  style={{
                                    padding: '3px 8px',
                                    background: 'rgba(29,158,117,0.06)',
                                    border: '1px solid rgba(29,158,117,0.2)',
                                    color: 'var(--teal)',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                  }}
                                >
                                  <Check size={9} /> Accept
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {optSuccess && (
                  <button
                    onClick={handleApplySectionChanges}
                    className="btn"
                    style={{
                      background: 'rgba(29,158,117,0.1)',
                      border: '1px solid rgba(29,158,117,0.2)',
                      color: 'var(--teal)',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      marginTop: 'auto'
                    }}
                  >
                    <CheckCircle2 size={12} /> Apply & Re-Match Resume
                  </button>
                )}

              </div>

            </motion.div>
          </div>

        </div>
      )}

    </div>
  );
}
