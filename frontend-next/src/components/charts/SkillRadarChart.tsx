'use client';
import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';

const data = [
  { skill: 'DSA',           value: 70 },
  { skill: 'System Design', value: 52 },
  { skill: 'Communication', value: 78 },
  { skill: 'Problem Solving', value: 80 },
  { skill: 'Tech Depth',    value: 65 },
];

export default function SkillRadarChart() {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 className="section-title">Skill Radar</h3>
      <p className="section-desc" style={{ marginBottom: 16 }}>Overall capability spread</p>

      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 20, right: 34, bottom: 20, left: 34 }}>
          <defs>
            <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#818cf8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#c084fc" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="var(--border-medium)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: 'var(--text-med)', fontSize: 11, fontWeight: 700 }}
            tickLine={false}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="#818cf8"
            fill="url(#radarGrad)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--bg-card)', r: 3, stroke: '#818cf8', strokeWidth: 2 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(10,10,18,0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '10px 14px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            formatter={(v: unknown) => [`${v}%`, 'Prof']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
