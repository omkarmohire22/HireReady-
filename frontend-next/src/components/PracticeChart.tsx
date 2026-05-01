'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { day: 'Mon', mins: 28 }, { day: 'Tue', mins: 46 }, { day: 'Wed', mins: 33 },
  { day: 'Thu', mins: 55 }, { day: 'Fri', mins: 42 }, { day: 'Sat', mins: 50 },
];

export default function PracticeChart() {
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="mb-4 text-sm text-slate-300">Weekly Practice</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip />
            <Bar dataKey="mins" fill="#00D4AA" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
