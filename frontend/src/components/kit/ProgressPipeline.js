'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { ErrorAlert } from '../ui/ErrorAlert';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'ANALYZING_JD', label: 'Analyzing job description' },
  { key: 'RESEARCHING_COMPANY', label: 'Researching company' },
  { key: 'DISCOVERING_PAGES', label: 'Discovering relevant pages' },
  { key: 'SEARCHING_DISCUSSIONS', label: 'Searching interview discussions' },
  { key: 'GENERATING_QUESTIONS', label: 'Generating interview questions' },
  { key: 'CHECKING_COVERAGE', label: 'Checking requirement coverage' },
  { key: 'GENERATING_MISSING', label: 'Closing coverage gaps' },
  { key: 'BUILDING_SCHEDULE', label: 'Building study schedule' },
  { key: 'GENERATING_FLASHCARDS', label: 'Preparing flashcards' },
  { key: 'VALIDATING_KIT', label: 'Validating final kit' }
];

export function ProgressPipeline({ isOpen, currentStage, message, error, onClose }) {
  if (!isOpen) return null;

  const activeIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={error ? onClose : undefined}
      title="Preparing your interview kit"
      subtitle="Executing multi-pass synthesis pipeline"
      maxWidth="max-w-md"
    >
      <div className="space-y-5 font-mono">
        {error ? (
          <ErrorAlert message={error} />
        ) : (
          <div className="space-y-2 py-2">
            {PIPELINE_STAGES.map((st, idx) => {
              const isCompleted = idx < activeIndex;
              const isCurrent = idx === activeIndex || (activeIndex === -1 && idx === 0);

              return (
                <div
                  key={st.key}
                  className={`flex items-center gap-3 text-xs p-2 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {message && !error && (
          <p className="text-[11px] text-slate-500 italic text-center border-t border-slate-200 pt-3">
            {message}
          </p>
        )}
      </div>
    </Modal>
  );
}
