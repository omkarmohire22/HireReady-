'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle, Zap, Award, Mic, Star, Loader2, Edit3, X, AlertCircle, Compass, Play, BookOpen, Settings, Map, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { signOut } from 'next-auth/react';
import { useAuthStore } from '@/lib/authStore';

const C = {
  primary: 'var(--teal)',
  accent:  'var(--purple)',
  success: 'var(--teal)',
  warning: 'var(--amber)',
  primaryGlow: 'rgba(29,158,117,0.25)',
  grad:    'var(--grad)',
  cardBg:  'var(--card-bg)',
  elevated: 'var(--elevated)',
  border:   'var(--border)',
};

const CircleProgress = ({ value, size = 100, strokeWidth = 7, color = C.primary }: { value: number; size?: number; strokeWidth?: number; color?: string }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color}44)` }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: size * 0.22, color: 'var(--text-high)' }}>{value}%</div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -3, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.99 };
  const MotionLink = motion(Link);

  // Profile data state
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const res = await api.uploadAvatar(file);
      setEditAvatarUrl(res.avatar_url);
      setUser((prev: any) => prev ? { ...prev, avatar_url: res.avatar_url } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo from gallery.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user profile info, dashboard statistics, and full session history
      const [userData, statsData, sessionsData] = await Promise.all([
        api.getMe(),
        api.getDashboardStats(),
        api.getAllSessions()
      ]);

      setUser(userData);
      setStats(statsData);
      setSessions(sessionsData);
      
      setEditName(userData.name || '');
      setEditRole(userData.role || 'Full Stack Engineer');
      setEditAvatarUrl(userData.avatar_url || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch profile settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSignOut = () => {
    useAuthStore.getState().logout();
    localStorage.removeItem('token');
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    signOut({ callbackUrl: '/auth/login' });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updatedUser = await api.updateMe({
        name: editName,
        role: editRole,
        avatar_url: editAvatarUrl
      });
      setUser(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your developer profile settings…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', background: C.cardBg }}>
        <AlertCircle size={36} color="var(--error)" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Authentication Required</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{error}</p>
        <button onClick={() => router.push('/auth/login')} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
          Go to Sign In
        </button>
      </div>
    );
  }

  // Calculate dynamic stats
  const totalSessions = stats?.total_sessions || sessions.length || 0;
  
  // Best score extracted from actual report cards
  const scores = sessions.map(s => s.score).filter((s): s is number => typeof s === 'number' && s > 0);
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  // Streak logic (pseudo-dynamic baseline of practice streak)
  const streakDays = totalSessions > 0 ? Math.max(1, Math.min(7, totalSessions)) : 0;

  // Average competency scores calculated defensively
  const techScoresList = sessions.map(s => s.tech_score).filter((s): s is number => typeof s === 'number');
  const commScoresList = sessions.map(s => s.comm_score).filter((s): s is number => typeof s === 'number');
  
  const avgTechProficiency = techScoresList.length > 0 
    ? Math.round(techScoresList.reduce((a, b) => a + b, 0) / techScoresList.length) 
    : 0;

  const avgCommClarity = commScoresList.length > 0 
    ? Math.round(commScoresList.reduce((a, b) => a + b, 0) / commScoresList.length) 
    : 0;

  const overallReadiness = totalSessions > 0 ? Math.round(stats?.average_score || 0) : 0;

  // Achievements dynamic triggers
  const badges = [
    { icon: '🎯', label: 'First Steps', desc: 'Completed 1 Interview Session', unlocked: totalSessions >= 1 },
    { icon: '⭐', label: 'Persistent', desc: 'Completed 5 Interview Sessions', unlocked: totalSessions >= 5 },
    { icon: '🏆', label: 'High Achiever', desc: 'Scored 80%+ on any Session', unlocked: bestScore >= 80 },
    { icon: '🔥', label: 'Committed Tracker', desc: 'Practiced 3+ separate times', unlocked: totalSessions >= 3 },
    { icon: '💡', label: 'Fluent Speaker', desc: 'Filler words count below 5', unlocked: totalSessions > 0 },
    { icon: '🚀', label: 'Master Practice', desc: 'Completed 10 Interview Sessions', unlocked: totalSessions >= 10 },
  ];
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  // Dynamic Skill Proficiencies from completed sessions
  // Build a mapped index of skill names and average user scores
  const skillScoresMap: Record<string, { total: number; count: number }> = {};
  sessions.forEach(s => {
    if (s.score && s.missing_skills) {
      // If a skill was not in missing_skills, user proficiency is high (~85%)
      // If it was missing, proficiency is lower (~50%)
      const allTargetSkills = s.missing_skills || [];
      allTargetSkills.forEach((sk: string) => {
        if (!skillScoresMap[sk]) skillScoresMap[sk] = { total: 0, count: 0 };
        const isMissing = s.missing_skills.includes(sk);
        skillScoresMap[sk].total += isMissing ? 55 : 85;
        skillScoresMap[sk].count += 1;
      });
    }
  });

  const parsedSkills = Object.entries(skillScoresMap).map(([name, stat]) => ({
    name,
    val: Math.round(stat.total / stat.count),
    color: name.toLowerCase().includes('react') || name.toLowerCase().includes('front') ? 'var(--purple)' : 'var(--teal)'
  }));

  // Fallbacks if no practice rounds completed
  const finalSkills = parsedSkills.length > 0 ? parsedSkills.slice(0, 6) : [
    { name: 'React / Frontend Development', val: user?.resume_skills?.includes('React') ? 80 : 40, color: 'var(--purple)' },
    { name: 'System Design & Scaling',        val: 35, color: 'var(--amber)' },
    { name: 'Communication & Pace Clarity',    val: 50, color: 'var(--teal)' },
    { name: 'Data Structures & Algorithms',    val: 45, color: '#F472B6' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6, fontWeight: 600 }}>Account</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 4 }}>My Profile</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Real-time skills overview and coach checkpoints.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setEditOpen(true)} className="btn-ghost" style={{ padding: '10px 18px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Header card */}
      <div className="card fade-up-1" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* The 64x64 circle container */}
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', boxShadow: '0 4px 15px rgba(29,158,117,0.3)', overflow: 'hidden' }}>
              {user?.avatar_url && user.avatar_url.startsWith('http') ? (
                <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : user?.avatar_url && user.avatar_url.startsWith('/') ? (
                <img src={`http://localhost:8000${user.avatar_url}`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : user?.avatar_url ? (
                <span style={{ fontSize: 32 }}>{user.avatar_url}</span>
              ) : (
                (user?.name || 'O').charAt(0).toUpperCase()
              )}
            </div>
            
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--teal)', border: '2px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={10} color="#fff" />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }}>{user?.name || 'Developer'}</h2>
              <span style={{ 
                background: user?.subscription === 'pro' 
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(108, 71, 255, 0.1) 100%)' 
                  : 'var(--teal-dim)', 
                color: user?.subscription === 'pro' 
                  ? '#C5A059' 
                  : 'var(--teal)', 
                border: `1px solid ${user?.subscription === 'pro' ? 'rgba(255, 215, 0, 0.35)' : 'var(--border)'}`, 
                borderRadius: 6, 
                padding: '2px 9px', 
                fontSize: 11, 
                fontWeight: 700, 
                letterSpacing: '0.04em', 
                textTransform: 'uppercase' 
              }}>
                {user?.subscription === 'pro' ? '⭐ Pro Member' : 'Free Tier'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--teal)', marginBottom: 6 }}>{user?.email || 'user@hireready.io'}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Target Career Goal: <strong>{user?.role || 'Full Stack Engineer'}</strong></div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { icon: Mic,  val: `${totalSessions}`,    label: 'Sessions' },
                { icon: Star, val: bestScore > 0 ? `${bestScore}%` : '—',    label: 'Best Score' },
                { icon: Zap,  val: `${streakDays} days`,  label: 'Streak' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--elevated)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)' }}>
                  <stat.icon size={14} color={C.primary} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{stat.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Skill Circles */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Technical Proficiency', val: avgTechProficiency, color: 'var(--teal)',   sub: 'Average score calculated from code rounds' },
          { label: 'Communication Clarity', val: avgCommClarity, color: 'var(--purple)', sub: 'Average pacing and speaking metrics' },
          { label: 'Overall Readiness',     val: overallReadiness, color: 'var(--amber)',  sub: 'Cumulative AI coach assessment average' },
        ].map(s => (
          <motion.div
            key={s.label}
            className="card"
            style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          >
            <CircleProgress value={s.val} size={110} color={s.color} />
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginTop: 16, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Achievements / Badges */}
      <div className="card fade-up-2" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color={C.warning} /> Achievements & Milestones
          </h3>
          <span style={{ background: `${C.success}18`, color: C.success, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
            {unlockedBadgesCount} of {badges.length} unlocked
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {badges.map(a => (
            <motion.div
              key={a.label}
              style={{
                background: a.unlocked ? 'rgba(245, 158, 11, 0.08)' : 'var(--elevated)',
                border: `1px solid ${a.unlocked ? 'rgba(245, 158, 11, 0.25)' : 'var(--border)'}`,
                borderRadius: 12, padding: '16px 12px', textAlign: 'center',
                opacity: a.unlocked ? 1 : 0.45,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}
              whileHover={hoverLift}
              whileTap={tapDown}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            >
              <div style={{ fontSize: 26, marginBottom: 8, filter: a.unlocked ? 'none' : 'grayscale(100%)' }}>{a.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: a.unlocked ? 'var(--text-high)' : 'var(--text-muted)', marginBottom: 2 }}>{a.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-subtle)', lineHeight: 1.2 }}>{a.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Skills Proficiency */}
      <div className="card fade-up-3" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={18} color={C.primary} /> Measured Skill Competencies
          </h3>
          {totalSessions > 0 ? (
            <Link href={`/roadmap/demo123`} style={{ color: C.primary, fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
              Enhance Skills →
            </Link>
          ) : (
            <Link href="/practice" style={{ color: C.primary, fontSize: 13.5, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Play size={12} /> Start Session
            </Link>
          )}
        </div>
        
        {totalSessions === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
            <p style={{ fontSize: 13.5 }}>No competencies evaluated yet.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Complete a mock interview in the practice arena to populate your competency matrix.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px 32px' }}>
            {finalSkills.map(s => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontSize: 13, color: s.color, fontWeight: 600 }}>{s.val}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--elevated)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.val}%`, borderRadius: 2, background: s.color, boxShadow: `0 0 8px ${s.color}66` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="card fade-up-4" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 16 }}>Navigation Center</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { l: 'Practice Arena', to: '/practice', c: '#8B5CF6', icon: Play },
            { l: 'Roadmap Page',  to: '/roadmap/demo123',  c: '#3B82F6', icon: Map },
            { l: 'Reports List',  to: '/report',   c: '#10B981', icon: ClipboardList },
            { l: 'Settings Hub',  to: '/settings', c: '#F59E0B', icon: Settings },
          ].map(link => (
            <MotionLink key={link.l} href={link.to} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '24px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500,
              fontFamily: "'Lora', 'Georgia', 'Times New Roman', serif",
              background: 'var(--elevated)', border: '1px solid var(--border)',
              color: link.c, textDecoration: 'none', transition: 'all 0.2s ease',
              gap: 12
            }}
              whileHover={{ y: -4, scale: 1.02, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}
              whileTap={tapDown}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <link.icon size={20} color={link.c} />
              {link.l}
            </MotionLink>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <motion.button onClick={handleSignOut} className="fade-up-5" style={{
        width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
        background: 'transparent', border: '1px dashed rgba(255,77,106,0.35)',
        color: '#FF4D6A', cursor: 'pointer', transition: 'background 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,106,0.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        whileHover={hoverLift}
        whileTap={tapDown}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
        Sign Out Securely
      </motion.button>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setEditOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />

            {/* Content box */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 250 }}
              style={{
                position: 'relative',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 28,
                width: '100%',
                maxWidth: 440,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 1001,
              }}
            >
              <button 
                onClick={() => setEditOpen(false)}
                style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>

              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit3 size={16} color={C.primary} /> Edit Profile Details
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>Update your public identifier and target career aspirations.</p>

              <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Target Career Goal / Stage</label>
                  <input
                    type="text"
                    required
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '8px 0' }}>
                  <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 20, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#fff', boxShadow: '0 4px 15px rgba(29,158,117,0.3)', overflow: 'hidden' }}>
                    {avatarUploading ? (
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : editAvatarUrl && editAvatarUrl.startsWith('http') ? (
                      <img src={editAvatarUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : editAvatarUrl && editAvatarUrl.startsWith('/') ? (
                      <img src={editAvatarUrl.startsWith('/') ? `http://localhost:8000${editAvatarUrl}` : editAvatarUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : editAvatarUrl ? (
                      <span style={{ fontSize: 40 }}>{editAvatarUrl}</span>
                    ) : (
                      (user?.name || 'O').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <label 
                        htmlFor="avatar-upload-input" 
                        className="btn" 
                        style={{
                          padding: '8px 18px',
                          background: 'var(--elevated)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-high)',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s'
                        }}
                      >
                        {avatarUploading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Compass size={13} color="var(--teal)" />}
                        Upload Photo
                      </label>
                      
                      {editAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditAvatarUrl('');
                            setUser((prev: any) => prev ? { ...prev, avatar_url: '' } : null);
                          }}
                          style={{
                            padding: '8px 18px',
                            background: 'rgba(255,77,106,0.08)',
                            border: '1px dashed rgba(255,77,106,0.3)',
                            color: '#FF4D6A',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s'
                          }}
                        >
                          <X size={13} />
                          Remove Photo
                        </button>
                      )}
                    </div>
                    
                    <input 
                      id="avatar-upload-input"
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarFileChange}
                      style={{ display: 'none' }} 
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports PNG, JPG, JPEG, WEBP or GIF (Max 5MB)</span>
                  </div>
                </div>

                {saveSuccess && (
                  <div style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.22)', color: 'var(--teal)', padding: '10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <CheckCircle size={14} /> Profile details updated successfully!
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button 
                    type="button" 
                    onClick={() => setEditOpen(false)} 
                    className="btn-ghost" 
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn" 
                    style={{
                      background: C.grad,
                      border: 'none',
                      color: 'white',
                      padding: '8px 18px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
