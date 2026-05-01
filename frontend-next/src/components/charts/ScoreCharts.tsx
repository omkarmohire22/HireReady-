'use client';
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

const scoreData = [
  { session: 'S1', score: 64 },
  { session: 'S2', score: 72 },
  { session: 'S3', score: 68 },
  { session: 'S4', score: 79 },
  { session: 'S5', score: 75 },
  { session: 'S6', score: 85 },
];

const weeklyData = [
  { day: 'Mon', minutes: 45 },
  { day: 'Tue', minutes: 80 },
  { day: 'Wed', minutes: 30 },
  { day: 'Thu', minutes: 110 },
  { day: 'Fri', minutes: 50 },
  { day: 'Sat', minutes: 90 },
  { day: 'Sun', minutes: 75 },
];

const toStyle = {
  background: 'rgba(10,10,18,0.95)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#e2e8f0',
  fontSize: 12,
  fontWeight: 600,
  padding: '10px 14px',
  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
};

const toPropStyle = { color: 'var(--text-low)', fontWeight: 600 };

export function ScoreTrendChart() {
  return (
    <div className="card" style={{ padding: '24px 24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 className="section-title">Score Trend</h3>
          <p className="section-desc">Last 6 practice sessions</p>
        </div>
        <div className="badge badge-green" style={{ fontSize: 12, padding: '4px 10px' }}>
          +21% Trend
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={scoreData} margin={{ top: 8, right: 4, left: -24, bottom: 4 }}>
          <defs>
            <linearGradient id="scoreG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--indigo)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--border-faint)" vertical={false} />
          <XAxis dataKey="session" tick={{ fill: 'var(--text-faint)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis domain={[55, 95]} tick={{ fill: 'var(--text-faint)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={toStyle} labelStyle={toPropStyle} formatter={(v: unknown) => [`${v}%`, 'Score']} cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area type="monotone" dataKey="score" stroke="var(--indigo)" strokeWidth={2.5} fill="url(#scoreG)"
                dot={{ fill: 'var(--bg-base)', r: 4, strokeWidth: 2, stroke: 'var(--indigo)' }}
                activeDot={{ r: 6, fill: '#818cf8', stroke: 'rgba(129,140,248,0.2)', strokeWidth: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const BAR_COLORS = ['#4f46e5','#5b52e8','#6366f1','#7c75f5','#818cf8','#9b95fb','#a5b4fc'];

export function WeeklyPracticeChart() {
  return (
    <div className="card" style={{ padding: '24px 24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 className="section-title">Weekly Practice</h3>
          <p className="section-desc">Active minutes per day</p>
        </div>
        <div className="badge badge-indigo" style={{ fontSize: 12, padding: '4px 10px' }}>
          This week
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={weeklyData} margin={{ top: 8, right: 4, left: -24, bottom: 4 }} barSize={34}>
          <defs>
            {weeklyData.map((_, i) => (
              <linearGradient key={i} id={`barG${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={BAR_COLORS[i]} stopOpacity={0.9} />
                <stop offset="100%" stopColor={BAR_COLORS[i]} stopOpacity={0.4} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--border-faint)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: 'var(--text-faint)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={toStyle} labelStyle={toPropStyle} formatter={(v: unknown) => [`${v}m`, 'Time']} cursor={{ fill: 'var(--bg-interactive)' }} />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
            {weeklyData.map((_, i) => <Cell key={i} fill={`url(#barG${i})`} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
