'use client';
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Palette, Bell, Shield, Globe, ChevronRight,
  Sun, Moon, Monitor, Mic,
  Zap, Target, Headphones, Lock, Github, Linkedin
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

const C = {
  primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E',
  warning: '#FFB547', error: '#FF4D6A',
  grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
};

/* ── Notification toggles ── */
function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <div>
        <p className="text-[14px] font-semibold text-[var(--text)]">{label}</p>
        <p className="text-[12px] mt-0.5 text-[var(--text-muted)]">{desc}</p>
      </div>
      <button onClick={onChange}
        className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
        style={{ background: value ? C.primary : 'var(--border-strong)', border: 'none', cursor: 'pointer' }}>
        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: value ? 22 : 2 }} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { isDark, toggle } = useTheme();
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };
  const [themeMode, setThemeMode]      = useState<'dark' | 'light' | 'system'>('dark');
  const [notifToggles, setNotifToggles] = useState({
    email:     true,
    push:      false,
    weekly:    true,
    interview: true,
    roadmap:   false,
  });
  
  // Audio Settings
  const [audioSettings, setAudioSettings] = useState({
    device: 'default',
    volume: 90,
  });

  // Interview Preferences
  const [interviewPrefs, setInterviewPrefs] = useState({
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    ttsSpeed: 1 as 0.8 | 0.9 | 1 | 1.1 | 1.5,
    maxQuestionsPerSession: 5,
    autoSubmitTimer: false,
    timerSeconds: 300,
  });

  const toggleNotif = (key: keyof typeof notifToggles) =>
    setNotifToggles(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up mb-6" data-aos="fade-up">
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }} className="text-2xl tracking-tight mb-1" >Settings</h1>
        <p className="text-[14px] text-[var(--text-muted)]">Manage your account preferences and configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* ── Appearance ── */}
          <motion.div
            className="card fade-up-1 p-6 flex-1"
            data-aos="fade-up"
            data-aos-delay={80}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.primary}1A`, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Appearance</p>
                <p className="text-[12px] text-[var(--text-muted)]">Theme and display preferences</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'dark',   label: 'Dark',   Icon: Moon },
                { id: 'light',  label: 'Light',  Icon: Sun },
                { id: 'system', label: 'System', Icon: Monitor },
              ] as const).map(({ id, label, Icon }) => {
                const active = themeMode === id;
                return (
                  <button key={id} onClick={() => { setThemeMode(id); if (id !== 'system') { if ((id === 'dark') !== isDark) toggle(); } }}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl font-semibold text-[13px] transition-all duration-200"
                    style={{
                      background: active ? `${C.primary}15` : 'var(--elevated)',
                      border: `1px solid ${active ? `${C.primary}55` : 'var(--border)'}`,
                      color: active ? C.primary : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}>
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ── Audio Settings ── */}
          <motion.div
            className="card fade-up-2 p-6 flex-1"
            data-aos="fade-up"
            data-aos-delay={120}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.accent}1A`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Audio Settings</p>
                <p className="text-[12px] text-[var(--text-muted)]">Microphone and speaker configurations</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 text-[13px] font-semibold mb-2 text-[var(--text)]">
                <Mic size={14} /> Microphone Device
              </label>
              <select
                value={audioSettings.device}
                onChange={(e) => setAudioSettings({ ...audioSettings, device: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}
              >
                <option value="default">Default Microphone</option>
                <option value="device1">External USB Mic</option>
                <option value="device2">Headset Microphone</option>
              </select>
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[13px] font-semibold text-[var(--text)]">Speaker Volume</label>
                <span className="text-[14px] font-bold" style={{ color: C.accent }}>{audioSettings.volume}%</span>
              </div>
              <input
                type="range"
                min="0" max="100"
                value={audioSettings.volume}
                onChange={(e) => setAudioSettings({ ...audioSettings, volume: parseInt(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer', accentColor: C.accent }}
              />
            </div>

            <button style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'var(--elevated)', border: `1px solid var(--border)`, color: C.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as any).style.background = `${C.accent}15`; (e.currentTarget as any).style.borderColor = `${C.accent}44`; }}
              onMouseLeave={(e) => { (e.currentTarget as any).style.background = 'var(--elevated)'; (e.currentTarget as any).style.borderColor = 'var(--border)'; }}>
              🎤 Test Microphone
            </button>
          </motion.div>

          {/* ── Security ── */}
          <motion.div
            className="card fade-up-5 p-6 flex-1"
            data-aos="fade-up"
            data-aos-delay={200}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(167, 139, 250, 0.1)`, color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Security</p>
                <p className="text-[12px] text-[var(--text-muted)]">Password and two-factor authentication</p>
              </div>
            </div>

            {[
              { label: 'Change Password',         desc: 'Last changed 30 days ago' },
              { label: 'Two-Factor Authentication', desc: 'Currently disabled' },
              { label: 'Active Sessions',         desc: '1 session active (this device)' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--elevated)] cursor-pointer transition-colors -mx-6 px-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-[var(--text-subtle)]" />
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text)]">{item.label}</p>
                    <p className="text-[12px] text-[var(--text-subtle)]">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-subtle)]" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* ── Interview Preferences ── */}
          <motion.div
            className="card fade-up-3 p-6 flex-1"
            data-aos="fade-up"
            data-aos-delay={120}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.warning}1A`, color: C.warning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Interview Preferences</p>
                <p className="text-[12px] text-[var(--text-muted)]">Customize your mock interview experience</p>
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-[13px] font-semibold mb-2 text-[var(--text)]">
                <Zap size={14} /> Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                  <button key={level} onClick={() => setInterviewPrefs({ ...interviewPrefs, difficulty: level })}
                    style={{ padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: interviewPrefs.difficulty === level ? `${C.warning}15` : 'var(--elevated)', border: `1px solid ${interviewPrefs.difficulty === level ? `${C.warning}55` : 'var(--border)'}`, color: interviewPrefs.difficulty === level ? C.warning : 'var(--text-muted)' }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* TTS Speed */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[13px] font-semibold text-[var(--text)]">Question Reading Speed</label>
                <span className="text-[13px] font-bold" style={{ color: C.warning }}>{interviewPrefs.ttsSpeed}x</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[0.8, 0.9, 1, 1.1, 1.5].map((speed) => (
                  <button key={speed} onClick={() => setInterviewPrefs({ ...interviewPrefs, ttsSpeed: speed as any })}
                    style={{ padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s', background: interviewPrefs.ttsSpeed === speed ? `${C.warning}15` : 'var(--elevated)', border: `1px solid ${interviewPrefs.ttsSpeed === speed ? `${C.warning}55` : 'var(--border)'}`, color: interviewPrefs.ttsSpeed === speed ? C.warning : 'var(--text-muted)' }}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Max Questions */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[13px] font-semibold text-[var(--text)]">Questions per Session</label>
                <span className="text-[14px] font-bold" style={{ color: C.warning }}>{interviewPrefs.maxQuestionsPerSession}</span>
              </div>
              <input type="range" min="3" max="10" value={interviewPrefs.maxQuestionsPerSession} onChange={(e) => setInterviewPrefs({ ...interviewPrefs, maxQuestionsPerSession: parseInt(e.target.value) })} style={{ width: '100%', cursor: 'pointer', accentColor: C.warning }} />
            </div>

            {/* Auto Submit Timer */}
            <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
              <div>
                <p className="text-[13px] font-semibold mb-1 text-[var(--text)]">Auto-submit after timer</p>
                <p className="text-[11px] text-[var(--text-muted)]">Auto-submit answer after {interviewPrefs.timerSeconds}s</p>
              </div>
              <button onClick={() => setInterviewPrefs({ ...interviewPrefs, autoSubmitTimer: !interviewPrefs.autoSubmitTimer })}
                className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
                style={{ background: interviewPrefs.autoSubmitTimer ? C.warning : 'var(--border-strong)', border: 'none', cursor: 'pointer' }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200" style={{ left: interviewPrefs.autoSubmitTimer ? 22 : 2 }} />
              </button>
            </div>
          </motion.div>

          {/* ── Notifications ── */}
          <motion.div
            className="card fade-up-4 p-6 flex-1"
            data-aos="fade-up"
            data-aos-delay={160}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.success}1A`, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Notifications</p>
                <p className="text-[12px] text-[var(--text-muted)]">Choose how and when you hear from us</p>
              </div>
            </div>

            <div className="space-y-0">
              <ToggleRow label="Email notifications"   desc="Receive updates and tips via email"         value={notifToggles.email}     onChange={() => toggleNotif('email')} />
              <ToggleRow label="Push notifications"    desc="Browser push alerts for reminders"          value={notifToggles.push}      onChange={() => toggleNotif('push')} />
              <ToggleRow label="Weekly report"         desc="Get a weekly digest of your progress"       value={notifToggles.weekly}    onChange={() => toggleNotif('weekly')} />
              <ToggleRow label="Interview reminders"   desc="Remind me to do a mock interview each day"  value={notifToggles.interview} onChange={() => toggleNotif('interview')} />
              <ToggleRow label="Roadmap updates"       desc="Notify when new learning resources are added" value={notifToggles.roadmap} onChange={() => toggleNotif('roadmap')} />
            </div>
          </motion.div>

          {/* ── Integrations ── */}
          <motion.div
            className="card fade-up-6 p-6 flex-1"
            data-aos="fade-up"
            data-aos-delay={200}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(244, 114, 182, 0.1)`, color: '#F472B6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Integrations</p>
                <p className="text-[12px] text-[var(--text-muted)]">Connect your external accounts</p>
              </div>
            </div>

            {[
              { Icon: Github,   label: 'GitHub',   desc: 'Not connected', color: '#94a3b8', connected: false },
              { Icon: Linkedin, label: 'LinkedIn', desc: 'Not connected', color: '#0ea5e9', connected: false },
            ].map((item, i) => {
              const Icon = item.Icon;
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text)]">{item.label}</p>
                      <p className="text-[12px] text-[var(--text-subtle)]">{item.desc}</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{ background: item.connected ? `${C.success}1A` : 'var(--elevated)', border: `1px solid ${item.connected ? `${C.success}44` : 'var(--border)'}`, color: item.connected ? C.success : 'var(--text)', cursor: 'pointer' }}>
                    {item.connected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </motion.div>

          {/* Delete account */}
          <motion.div
            className="fade-up-6 p-6 mt-2"
            data-aos="fade-up"
            data-aos-delay={240}
            style={{ border: `1px dashed ${C.error}55`, borderRadius: 16, background: `${C.error}05` }}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <p className="text-[15px] font-bold mb-1" style={{ color: C.error, fontFamily: 'Syne, sans-serif' }}>Danger Zone</p>
            <p className="text-[13px] mb-4 text-[var(--text-muted)]">Irreversible account actions. Proceed with caution.</p>
            <button style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: `${C.error}15`, border: `1px solid ${C.error}44`, color: C.error, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.error}25`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${C.error}15`; }}>
              Delete Account
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
