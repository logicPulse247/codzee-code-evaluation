'use client';

import { Calendar, Clock, RefreshCw } from 'lucide-react';

export default function ScheduleView({ schedule, questions, onRegenerateSchedule }) {
  const days = schedule?.days || [];
  const daysAvailable = schedule?.days_available || 5;

  const totalMinutes = days.reduce((acc, d) => acc + (d.minutes || 0), 0);
  const qMap = new Map((questions || []).map(q => [q.id, q]));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-xl font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{daysAvailable}-Day Study Schedule</h2>
            <p className="text-xs text-slate-400">
              Deterministic allocation • Total estimated study time: {Math.round(totalMinutes / 60 * 10) / 10} hours ({totalMinutes} mins)
            </p>
          </div>
        </div>

        {onRegenerateSchedule && (
          <button
            onClick={() => onRegenerateSchedule('schedule')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate Allocation
          </button>
        )}
      </div>

      {/* Days Grid */}
      <div className="space-y-4">
        {days.map((d, idx) => {
          const dayNum = d.day ?? d.day_number ?? (idx + 1);
          const focusArea = d.focus || d.focus_area || d.theme || `Study Focus — Day ${dayNum}`;
          const qIds = Array.isArray(d.question_ids) ? d.question_ids : [];
          const dayQuestions = qIds.map(id => qMap.get(id)).filter(Boolean);

          return (
            <div
              key={dayNum || idx}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30 font-mono">
                    D{dayNum}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">{focusArea}</h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{d.minutes || 30} Minutes</span>
                </div>
              </div>

              {dayQuestions.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                    Assigned Questions ({dayQuestions.length}):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {dayQuestions.map((q) => (
                      <div key={q.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs flex items-start gap-2">
                        <span className="font-mono text-indigo-300 font-bold text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {q.id}
                        </span>
                        <p className="text-slate-200 line-clamp-2 leading-relaxed">{q.prompt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Self-study, mock interviews, and consolidation day.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
