'use client';
import React, { useState } from 'react';
import { CheckCircle, Circle, ExternalLink } from 'lucide-react';

const C = {
  primary: '#6C47FF', accent: '#00E5FF', success: '#00D97E',
  warning: '#FFB547', grad: 'linear-gradient(135deg, #6C47FF, #00E5FF)',
  primaryGlow: 'rgba(108,71,255,0.3)',
};

const RESOURCES: Record<string, { label: string; url: string }> = {
  'Arrays & Strings':       { label: 'LeetCode Arrays',    url: 'https://leetcode.com/tag/array/' },
  'Trees & Graphs':         { label: 'VisuAlgo Trees',     url: 'https://visualgo.net/en/bst' },
  'Hash Maps':              { label: 'CS50 Hashing',       url: 'https://cs50.harvard.edu' },
  'Load Balancing':         { label: 'NGINX Docs',         url: 'https://docs.nginx.com' },
  'Caching Strategies':     { label: 'Redis University',   url: 'https://university.redis.com' },
  'Database Design':        { label: 'DB Design Guide',    url: 'https://www.databasestar.com' },
  'STAR Method':            { label: 'STAR Guide',         url: 'https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique' },
  'Conflict Resolution':    { label: 'MindTools',          url: 'https://www.mindtools.com/pages/article/newTMC_05.htm' },
  'Leadership Stories':     { label: 'HBR Leadership',     url: 'https://hbr.org/topic/leadership' },
  'FAANG Simulations':      { label: 'Pramp.com',          url: 'https://www.pramp.com' },
  'Timed Practice':         { label: 'LeetCode Contest',   url: 'https://leetcode.com/contest/' },
  'Feedback Review':        { label: 'Interviewing.io',    url: 'https://interviewing.io' },
};

const initialStages = [
  { week: 'Week 1–2', title: 'Data Structures Fundamentals', topics: ['Arrays & Strings', 'Trees & Graphs', 'Hash Maps'], progress: 80, color: C.success },
  { week: 'Week 3–4', title: 'System Design Basics', topics: ['Load Balancing', 'Caching Strategies', 'Database Design'], progress: 45, color: C.warning },
  { week: 'Week 5–6', title: 'Communication & Behavioural', topics: ['STAR Method', 'Conflict Resolution', 'Leadership Stories'], progress: 20, color: C.primary },
  { week: 'Week 7–8', title: 'Mock Interview Sprints', topics: ['FAANG Simulations', 'Timed Practice', 'Feedback Review'], progress: 0, color: C.accent },
];

export default function LearningRoadmap() {
  const [checkedTopics, setCheckedTopics] = useState<Set<string>>(new Set(['Arrays & Strings', 'Trees & Graphs']));

  const toggleTopic = (topic: string) => {
    setCheckedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  // Recalculate progress based on checked topics
  const stages = initialStages.map(s => ({
    ...s,
    progress: Math.round((s.topics.filter(t => checkedTopics.has(t)).length / s.topics.length) * 100),
  }));

  const totalPct = Math.round(stages.reduce((a, s) => a + s.progress, 0) / stages.length);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h1 className="fade-up" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-1px', marginBottom: 8 }}>
        Learning Roadmap
      </h1>
      <p className="fade-up-1" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Your personalised path to becoming interview-ready. Check off topics as you study them.
      </p>

      {/* Progress banner */}
      <div className="card fade-up-2" style={{
        padding: 28, marginBottom: 40,
        background: `linear-gradient(135deg, ${C.primary}12, ${C.accent}08)`,
        border: `1px solid ${C.primary}22`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Overall Progress</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 48, letterSpacing: '-2px' }}>
              {totalPct}<span style={{ fontSize: 20, color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Completed', val: stages.filter(s => s.progress === 100).length.toString() },
              { label: 'In Progress', val: stages.filter(s => s.progress > 0 && s.progress < 100).length.toString() },
              { label: 'Not Started', val: stages.filter(s => s.progress === 0).length.toString() },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--elevated)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalPct}%`, background: C.grad, borderRadius: 3, transition: 'width 0.6s ease', boxShadow: `0 0 12px ${C.primaryGlow}` }} />
        </div>
      </div>

      {stages.map((stage, i) => (
        <div key={i} className={`fade-up-${i + 2}`} style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: stage.progress > 0 ? `${stage.color}22` : 'var(--elevated)',
              border: `2px solid ${stage.progress > 0 ? stage.color : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {stage.progress === 100 ? <CheckCircle size={18} color={stage.color} /> : <span style={{ fontSize: 14, fontWeight: 700, color: stage.progress > 0 ? stage.color : 'var(--text-muted)' }}>{i + 1}</span>}
            </div>
            {i < stages.length - 1 && (
              <div style={{ width: 2, flex: 1, minHeight: 40, background: `linear-gradient(180deg, ${stage.color}66, transparent)`, marginTop: 8 }} />
            )}
          </div>
          <div className="card" style={{ flex: 1, padding: 24, marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: stage.color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{stage.week}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>{stage.title}</div>
              </div>
              <span style={{ background: `${stage.color}18`, color: stage.color, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {stage.progress}%
              </span>
            </div>

            {/* Topic pills with checkboxes */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {stage.topics.map(topic => {
                const done = checkedTopics.has(topic);
                const resource = RESOURCES[topic];
                return (
                  <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${done ? stage.color + '55' : 'var(--border)'}`, background: done ? `${stage.color}10` : 'var(--elevated)', transition: 'all 0.2s' }}>
                    <button
                      onClick={() => toggleTopic(topic)}
                      style={{ padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                      title={done ? 'Mark as incomplete' : 'Mark as done'}
                    >
                      {done
                        ? <CheckCircle size={13} color={stage.color} />
                        : <Circle size={13} color="var(--text-subtle)" />
                      }
                      <span style={{ fontSize: 12, color: done ? stage.color : 'var(--text-muted)', fontWeight: done ? 600 : 400 }}>{topic}</span>
                    </button>
                    {resource && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`📖 ${resource.label}`}
                        style={{ padding: '6px 8px', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border)', transition: 'color 0.2s', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = stage.color)}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ height: 4, borderRadius: 2, background: 'var(--elevated)' }}>
              <div style={{ height: '100%', width: `${stage.progress}%`, borderRadius: 2, background: stage.color, transition: 'width 0.6s ease', boxShadow: stage.progress > 0 ? `0 0 8px ${stage.color}66` : 'none' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
