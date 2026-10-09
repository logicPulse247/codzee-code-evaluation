'use client';

import { Loader2, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';

const STAGES = [
  { key: 'ANALYZING_JD', label: 'Analyzing job description...' },
  { key: 'RESEARCHING_COMPANY', label: 'Researching company...' },
  { key: 'DISCOVERING_PAGES', label: 'Discovering relevant pages...' },
  { key: 'SEARCHING_DISCUSSIONS', label: 'Searching interview discussions...' },
  { key: 'GENERATING_QUESTIONS', label: 'Generating questions...' },
  { key: 'CHECKING_COVERAGE', label: 'Checking requirement coverage...' },
  { key: 'GENERATING_MISSING', label: 'Generating missing questions...' },
  { key: 'BUILDING_SCHEDULE', label: 'Building study schedule...' },
  { key: 'GENERATING_FLASHCARDS', label: 'Generating flashcards...' },
  { key: 'VALIDATING_KIT', label: 'Validating final kit...' }
];

export default function GenerationProgressModal({ isOpen, currentStage, message, error }) {
  if (!isOpen) return null;

  const currentStageIndex = STAGES.findIndex(s => s.key === currentStage);
  const progressPercent = Math.min(100, Math.max(10, ((currentStageIndex + 1) / STAGES.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-white">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Generating Interview Kit</h3>
            <p className="text-xs text-slate-400">Executing multi-stage analysis pipeline</p>
          </div>
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Pipeline Execution Error</p>
              <p className="text-xs mt-1 text-rose-300">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-indigo-300">
                <span>{message || 'Processing...'}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stage checklist */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {STAGES.map((st, idx) => {
                const isDone = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div
                    key={st.key}
                    className={`flex items-center gap-3 text-xs p-2 rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-indigo-950/60 text-indigo-200 border border-indigo-800/40 font-medium'
                        : isDone
                        ? 'text-slate-400 opacity-80'
                        : 'text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
