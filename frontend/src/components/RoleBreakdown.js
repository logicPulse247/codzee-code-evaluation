'use client';

import { Briefcase, Target, ShieldAlert, Award } from 'lucide-react';

export default function RoleBreakdown({ role }) {
  const requirements = role?.requirements || [];
  const mustCount = requirements.filter(r => r.priority === 'must').length;
  const niceCount = requirements.filter(r => r.priority === 'nice').length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{role?.title || 'Target Role'}</h2>
            <span className="text-xs text-indigo-300 font-medium">Seniority: {role?.seniority || 'Mid-Senior'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            {mustCount} Must-Have
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            {niceCount} Nice-to-Have
          </span>
        </div>
      </div>

      {role?.responsibilities && role.responsibilities.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Responsibilities</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
            {role.responsibilities.map((resp, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-4 h-4 text-indigo-400" />
          Extracted Role Requirements ({requirements.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={`p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                req.priority === 'must'
                  ? 'bg-slate-950/90 border-slate-800/90 hover:border-indigo-800/60'
                  : 'bg-slate-950/50 border-slate-800/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                    {req.id}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      req.kind === 'technical'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : req.kind === 'behavioural'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {req.kind}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{req.text}</p>
              </div>

              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  req.priority === 'must'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {req.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
