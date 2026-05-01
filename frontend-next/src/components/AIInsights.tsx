import { Sparkles } from 'lucide-react';

const insights = ['Improve System Design', 'Communication is improving', 'Strong in React'];

export default function AIInsights() {
  return (
    <div className="glass-card rounded-xl border-l-4 border-l-[#00D4AA] p-5">
      <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-[#00D4AA]" /><h3 className="font-semibold">AI Insights</h3></div>
      <div className="space-y-2 text-sm text-slate-300">
        {insights.map((item) => <p key={item}>• {item}</p>)}
      </div>
    </div>
  );
}
