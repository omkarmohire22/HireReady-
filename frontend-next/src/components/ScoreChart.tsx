'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { week: 'W1', score: 62 }, { week: 'W2', score: 66 }, { week: 'W3', score: 72 },
  { week: 'W4', score: 70 }, { week: 'W5', score: 76 }, { week: 'W6', score: 78 },
];

export default function ScoreChart() {
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="mb-4 text-sm text-slate-300">Score Trend</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6C63FF" stopOpacity={0.55} /><stop offset="95%" stopColor="#6C63FF" stopOpacity={0.06} /></linearGradient></defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="week" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip />
            <Area type="monotone" dataKey="score" stroke="#6C63FF" fill="url(#scoreFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
