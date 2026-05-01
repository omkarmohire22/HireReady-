'use client';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';

const data = [
  { skill: 'DSA', value: 72 },
  { skill: 'System Design', value: 58 },
  { skill: 'Communication', value: 80 },
  { skill: 'React', value: 84 },
  { skill: 'Problem Solving', value: 76 },
];

export default function SkillRadarChart() {
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="mb-4 text-sm text-slate-300">Skill Radar</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <Radar dataKey="value" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
