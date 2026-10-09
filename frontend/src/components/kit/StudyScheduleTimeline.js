'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { Clock, Calendar, HelpCircle } from 'lucide-react';

export function StudyScheduleTimeline({ schedule, questions = [] }) {
  const days = schedule?.days || [];

  if (!days.length) {
    return (
      <div className="py-12 text-center text-xs font-mono text-slate-500 border border-slate-200 rounded-xl bg-white">
        No schedule available.
      </div>
    );
  }

  const totalMinutes = days.reduce((acc, d) => acc + (d.minutes || 0), 0);

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-serif text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{schedule.days_available || days.length}-Day Preparation Timeline</span>
          </h3>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Deterministic allocation • Estimated {Math.round(totalMinutes / 60 * 10) / 10} total study hours ({totalMinutes} mins)
          </p>
        </div>

        <Badge variant="default" size="md">
          Total Study Days: {days.length}
        </Badge>
      </div>

      {/* Vertical Timeline */}
      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 font-mono">
        {days.map((dayObj, idx) => {
          const dayNumber = dayObj.day ?? dayObj.day_number ?? (idx + 1);
          const focusArea = dayObj.focus || dayObj.focus_area || dayObj.theme || `Study Focus — Day ${dayNumber}`;
          const qIds = Array.isArray(dayObj.question_ids) ? dayObj.question_ids : [];
          const assignedQs = questions.filter(q => qIds.includes(q.id));

          return (
            <div key={dayNumber || idx} className="relative pl-6 space-y-3">
              {/* Timeline Bullet */}
              <div className="absolute -left-2.25 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              </div>

              {/* Day Details Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Day {dayNumber}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 font-serif">
                      {focusArea}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dayObj.minutes || 30} minutes</span>
                  </div>
                </div>

                {/* Assigned Questions */}
                {assignedQs.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Assigned Interview Questions ({assignedQs.length}):
                    </span>
                    <div className="space-y-1.5 font-sans">
                      {assignedQs.map((q) => (
                        <div
                          key={q.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start gap-2 text-slate-900"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="font-medium">{q.prompt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-sans text-slate-400 italic">
                    Self-study, mock interviews, and requirement review.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
