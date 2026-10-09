'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { Pin, Edit3, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export function QuestionItem({
  question,
  index,
  total,
  requirements = [],
  onEdit,
  onPinToggle,
  onDelete,
  onMoveUp,
  onMoveDown
}) {
  const reqIds = Array.isArray(question?.requirement_ids) ? question.requirement_ids : [];
  const reqMapped = requirements.filter(r => reqIds.includes(r.id));
  const isPinned = question?.status === 'pinned';
  const isEdited = question?.status === 'edited';

  const outlines = Array.isArray(question?.answer_outline)
    ? question.answer_outline
    : typeof question?.answer_outline === 'string' && question.answer_outline.trim()
    ? [question.answer_outline]
    : [];

  return (
    <div className={`p-5 rounded-xl border bg-white transition-colors space-y-3 font-sans shadow-xs ${
      isPinned
        ? 'border-amber-300 bg-amber-50/40'
        : 'border-slate-200 hover:border-blue-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="font-mono text-xs font-bold text-slate-400 pt-0.5">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold text-slate-900 leading-snug">
              {question.prompt}
            </h4>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono">
              <Badge variant="default" size="sm">
                Difficulty: {question.difficulty || 3}/5
              </Badge>

              {isPinned && (
                <Badge variant="pinned" size="sm">
                  PINNED
                </Badge>
              )}

              {isEdited && (
                <Badge variant="edited" size="sm">
                  EDITED
                </Badge>
              )}

              {reqMapped.map(r => (
                <Badge key={r.id} variant={r.priority === 'must' ? 'must' : 'nice'} size="sm">
                  Req: {r.text}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Question Item Action Toolbar */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-slate-200 my-auto" />
          <button
            onClick={() => onPinToggle(question.id)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isPinned
                ? 'text-amber-700 bg-amber-100'
                : 'text-slate-400 hover:text-amber-600'
            }`}
            title={isPinned ? 'Unpin Question' : 'Pin Question'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(question)}
            className="p-1 rounded text-slate-400 hover:text-blue-600 cursor-pointer"
            title="Edit Question"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
            title="Delete Question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Answer Outline */}
      {outlines.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-1 font-mono">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Answer Outline:
          </span>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
            {outlines.map((pt, pIdx) => (
              <li key={pIdx}>{pt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
