'use client';
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Palette, User, Target, Award,
  CheckCircle, Loader2, AlertCircle, Trash2, Plus, Moon, Sun, Monitor, ShieldCheck, Mail
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/components/theme/ThemeProvider';

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

export default function SettingsPage() {
  const { isDark, toggle } = useTheme();
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };

  // Theme preference local state
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Backend Profile States
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  
  // Loading & Saving indicators
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sync local theme state on load
    setThemeMode(isDark ? 'dark' : 'light');

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await api.getMe();
        setUser(userData);
        setName(userData.name || '');
        setRole(userData.role || 'Full Stack Engineer');
        setSkills(userData.resume_skills || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch settings details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [isDark]);

  const [parsingResume, setParsingResume] = useState(false);

  const handleResumeReparse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingResume(true);
    setSaveSuccess(false);
    setError(null);
    try {
      await api.uploadResume(file);
      const freshUser = await api.getMe();
      setUser(freshUser);
      setSkills(freshUser.resume_skills || []);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to re-parse skills from resume.');
    } finally {
      setParsingResume(false);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSkill.trim();
    if (!clean) return;
    if (skills.includes(clean)) {
      setNewSkill('');
      return;
    }
    setSkills(prev => [...prev, clean]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const updated = await api.updateMe({
        name,
        role,
        resume_skills: skills
      });
      setUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes to the backend.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading account settings...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up mb-6">
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6, fontWeight: 600 }}>Configuration</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 4 }}>Account Settings</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Manage your personal details, verified core skills, and display preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
        {/* LEFT & CENTER COLUMNS: Profile and Skills */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Personal Profile Details Card */}
          <motion.div
            className="card fade-up-1 p-7"
            whileHover={hoverLift}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--teal-dim)', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>Professional Identity</h3>
                <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>Configure personal details and primary targets</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email Address (Read-only) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={12} /> Email Address (Read-only)
                </label>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-subtle)', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {user?.email}
                  <span style={{ fontSize: 10, background: 'rgba(29,158,117,0.1)', color: 'var(--teal)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, marginLeft: 'auto' }}>VERIFIED</span>
                </div>
              </div>

              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13.5, outline: 'none' }}
                />
              </div>

              {/* Target Career Goal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Target size={12} /> Target Career Goal / Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Full Stack Engineer"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13.5, outline: 'none' }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Used by our AI to tailor practice interviews and map roadmaps.</span>
              </div>
            </div>
          </motion.div>

          {/* Skills Directory Card */}
          <motion.div
            className="card fade-up-2 p-7"
            whileHover={hoverLift}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--purple-dim)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>Skills Directory</h3>
                <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>Verified competencies evaluated in mock practices</p>
              </div>
            </div>

            {/* Auto-populate Resume Widget */}
            <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(108,71,255,0.04)', border: '1px dashed rgba(108,71,255,0.22)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)', display: 'block', marginBottom: 2 }}>Auto-populate from Resume</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Upload a new PDF to extract clean technical skills instantly.</span>
              </div>
              <label htmlFor="resume-settings-upload" style={{ padding: '8px 16px', background: 'var(--purple-dim)', border: '1px solid rgba(108,71,255,0.25)', color: 'var(--accent)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                {parsingResume ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {parsingResume ? 'Extracting...' : 'Upload PDF'}
              </label>
              <input id="resume-settings-upload" type="file" accept=".pdf" onChange={handleResumeReparse} disabled={parsingResume} style={{ display: 'none' }} />
            </div>

            {/* List current skills */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>My Active Skills Directory ({skills.length})</label>
              {skills.length === 0 ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px dashed var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  No skills listed. Type below or upload a resume to populate!
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {skills.map((skill) => (
                    <div
                      key={skill}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--text-high)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#FF4D6A',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add custom skill */}
            <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="Type a skill (e.g. Python, Docker, Next.js)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  background: 'var(--teal-dim)',
                  border: '1px solid rgba(29,158,117,0.25)',
                  borderRadius: 10,
                  color: 'var(--teal)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={14} /> Add
              </button>
            </form>
          </motion.div>
          
          {/* Action Save Banner */}
          {error && (
            <div style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', color: '#FF4D6A', padding: '12px 16px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {saveSuccess && (
            <div style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.22)', color: 'var(--teal)', padding: '12px 16px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} /> Profile preferences committed and saved dynamically!
            </div>
          )}

          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="btn-primary"
            style={{ padding: '14px 24px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}
          >
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />}
            {saving ? 'Saving changes to database...' : 'Commit & Save Settings'}
          </button>
        </div>

        {/* RIGHT COLUMN: Subscription & Appearance */}
        <div className="flex flex-col gap-6">
          
          {/* Premium Subscription Card */}
          <motion.div
            className="card fade-up-3 p-7"
            whileHover={hoverLift}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            style={{
              background: user?.subscription === 'pro' ? 'linear-gradient(135deg, rgba(108,71,255,0.06), rgba(0,229,255,0.03))' : 'var(--card-bg)',
              border: user?.subscription === 'pro' ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: user?.subscription === 'pro' ? 'rgba(108,71,255,0.15)' : 'var(--elevated)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palette size={16} color={user?.subscription === 'pro' ? 'var(--accent)' : 'var(--purple)'} />
              </div>
              <div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>Membership</h3>
                <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>Current plan status</p>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: 12, background: 'var(--elevated)', border: '1px solid var(--border)', textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4, letterSpacing: 0.5 }}>ACTIVE TIER</span>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: user?.subscription === 'pro' ? 'var(--accent)' : 'var(--text-high)' }}>
                {user?.subscription === 'pro' ? '⭐ Pro Membership' : 'Free Practice Plan'}
              </span>
            </div>

            {user?.subscription !== 'pro' ? (
              <div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                  Upgrade to Pro to unlock unlimited dynamic 4-week skills roadmaps, professional PDF downloads, and advanced behavioral analysis.
                </p>
                <button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      // Call backend subscription upgrade endpoint
                      await api.upgradePlan();
                      setUser((prev: any) => ({ ...prev, subscription: 'pro' }));
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="btn"
                  style={{ width: '100%', background: C.grad, border: 'none', color: '#fff', padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Upgrade to Pro Tier
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12.5, color: 'var(--teal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  ✓ Unlimited Premium Features Unlocked
                </p>
              </div>
            )}
          </motion.div>

          {/* Theme Display Card */}
          <motion.div
            className="card fade-up-4 p-7"
            whileHover={hoverLift}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--elevated)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palette size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>Appearance</h3>
                <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>Theme display preferences</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: 'dark',  label: 'Dark Mode', Icon: Moon },
                { id: 'light', label: 'Light Mode', Icon: Sun },
              ].map(({ id, label, Icon }) => {
                const active = themeMode === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setThemeMode(id as 'dark' | 'light');
                      if ((id === 'dark') !== isDark) {
                        toggle();
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '16px 10px',
                      borderRadius: 12,
                      fontSize: 12.5,
                      fontWeight: 600,
                      background: active ? 'var(--teal-dim)' : 'var(--elevated)',
                      border: `1px solid ${active ? 'rgba(29,158,117,0.35)' : 'var(--border)'}`,
                      color: active ? 'var(--teal)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
