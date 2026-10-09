'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { api } from '@/lib/api';
import { CheckCircle2, ArrowRight, Eye, RefreshCw, AlertTriangle } from 'lucide-react';

export function PracticeModeSession({ kitId, flashcards = [], onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!flashcards.length) {
    return (
      <div className="py-12 text-center text-xs font-mono text-slate-500 border border-slate-200 rounded-xl space-y-3 bg-white">
        <p>No flashcards available for practice in this kit.</p>
        <Link href={`/kit/${kitId}`}>
          <Button variant="outline" size="sm">Back to Kit Builder</Button>
        </Link>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleConfidence = (score) => {
    const updated = [
      ...sessionResults,
      {
        cardId: currentCard.id,
        requirement_ids: currentCard.requirement_ids || [],
        confidenceScore: score
      }
    ];
    setSessionResults(updated);

    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    } else {
      finishPractice(updated);
    }
  };

  const finishPractice = async (resultsToSubmit) => {
    setIsSubmitting(true);
    try {
      await api.post('/practice/record', {
        kit_id: kitId,
        cardsPracticed: resultsToSubmit.map(r => ({
          card_id: r.cardId,
          confidence_score: r.confidenceScore
        }))
      });
      setIsFinished(true);
    } catch (err) {
      console.error('Failed to submit practice record:', err);
      setIsFinished(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFinished) {
    const lowConfidenceCount = sessionResults.filter(r => r.confidenceScore === 1).length;

    return (
      <div className="max-w-md mx-auto py-12 px-6 bg-white border border-slate-200 rounded-xl shadow-xs text-center space-y-5 font-sans text-slate-900">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold font-serif text-slate-900">Practice Session Complete</h3>
          <p className="text-xs font-mono text-slate-500">
            You completed {flashcards.length} active-recall cards.
          </p>
        </div>

        {lowConfidenceCount > 0 ? (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono text-amber-800 flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Found {lowConfidenceCount} cards rated low confidence needing review.</span>
          </div>
        ) : (
          <p className="text-xs font-mono text-blue-600 font-semibold">
            Great job! High confidence recorded across cards.
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-2 font-mono">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              setCurrentIndex(0);
              setIsRevealed(false);
              setSessionResults([]);
              setIsFinished(false);
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </Button>

          <Link href={`/weak-spots/${kitId}`} className="flex-1">
            <Button variant="primary" size="sm" className="w-full">
              <span>View Weak Spots</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-200 pb-3">
        <span className="font-semibold text-slate-800">
          Practice Session
        </span>
        <span>
          Card {currentIndex + 1} of {flashcards.length}
        </span>
      </div>

      {/* Main Flashcard Interface */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6 min-h-64 flex flex-col justify-between text-center">
        <div className="space-y-4 my-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600 block">
            Question Prompt
          </span>
          <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900 leading-relaxed">
            {currentCard.front}
          </h3>

          {isRevealed && (
            <div className="pt-6 border-t border-slate-200 space-y-2 animate-fadeIn text-left font-mono">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block text-center">
                Answer Explanation
              </span>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
                {currentCard.back}
              </div>
            </div>
          )}
        </div>

        {/* Interaction Actions */}
        {!isRevealed ? (
          <div className="pt-4 border-t border-slate-200">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsRevealed(true)}
              className="w-full"
            >
              <Eye className="w-4 h-4" />
              <span>Reveal Answer</span>
            </Button>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-200 space-y-3 font-mono">
            <span className="text-xs font-semibold text-slate-500 block">
              How confident are you with this answer?
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleConfidence(1)}
                className="py-2.5 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Low (1)
              </button>
              <button
                onClick={() => handleConfidence(2)}
                className="py-2.5 px-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 font-bold text-xs hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Medium (2)
              </button>
              <button
                onClick={() => handleConfidence(3)}
                className="py-2.5 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                High (3)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
