'use client';

import { useState } from 'react';
import { Eye, RotateCcw, Award, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

export default function FlashcardPractice({ kitId, flashcards, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [scores, setScores] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-white">
        <p className="text-slate-400">No flashcards available for practice in this kit.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleRateConfidence = (level) => {
    const updated = {
      ...scores,
      [currentCard.id]: level
    };
    setScores(updated);

    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      finishPracticeSession(updated);
    }
  };

  const finishPracticeSession = async (finalScores) => {
    setIsFinished(true);
    setIsSaving(true);
    try {
      const payload = Object.entries(finalScores).map(([cardId, conf]) => ({
        flashcard_id: cardId,
        confidence: conf
      }));
      await api.post('/practice/record', {
        kitId,
        scores: payload
      });
    } catch (e) {
      console.error('Failed to save practice record:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isFinished) {
    const scoreValues = Object.values(scores);
    const lowCount = scoreValues.filter(v => v === 1).length;
    const medCount = scoreValues.filter(v => v === 2).length;
    const highCount = scoreValues.filter(v => v === 3).length;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-white text-center max-w-xl mx-auto shadow-2xl animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-100">Practice Session Completed!</h2>
          <p className="text-sm text-slate-400">Great job reviewing {flashcards.length} active recall cards.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60">
            <span className="text-2xl font-bold text-rose-400">{lowCount}</span>
            <span className="block text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Low</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/60">
            <span className="text-2xl font-bold text-amber-400">{medCount}</span>
            <span className="block text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Medium</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60">
            <span className="text-2xl font-bold text-emerald-400">{highCount}</span>
            <span className="block text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">High</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setScores({});
              setIsFinished(false);
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Practice Again
          </button>

          {onComplete && (
            <button
              onClick={onComplete}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>View Weak Spots Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
        <span>Card {currentIndex + 1} of {flashcards.length}</span>
        <span className="text-indigo-400 font-mono">ID: {currentCard.id}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* Interactive Flip Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[260px] cursor-pointer bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative group transition-all"
      >
        <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800/80 text-indigo-300 border border-slate-700">
          {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
        </span>

        <div className="space-y-4 my-auto max-w-lg">
          {!isFlipped ? (
            <p className="text-lg font-bold text-slate-100 leading-snug">{currentCard.front}</p>
          ) : (
            <p className="text-base font-medium text-indigo-200 leading-relaxed">{currentCard.back}</p>
          )}
        </div>

        <div className="mt-4 text-xs font-semibold text-slate-500 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
          <Eye className="w-4 h-4" />
          <span>{isFlipped ? 'Click to view question' : 'Click to reveal answer'}</span>
        </div>
      </div>

      {/* Confidence Rating Bar */}
      {isFlipped && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <p className="text-xs font-bold text-slate-300 text-center uppercase tracking-wider">
            How confident are you with this answer?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRateConfidence(1)}
              className="py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-200 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-md shadow-rose-950/50"
            >
              <span>1 • Low</span>
              <span className="text-[10px] font-normal text-rose-300">Need Review</span>
            </button>
            <button
              onClick={() => handleRateConfidence(2)}
              className="py-3 px-4 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-200 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-md shadow-amber-950/50"
            >
              <span>2 • Medium</span>
              <span className="text-[10px] font-normal text-amber-300">Somewhat Sure</span>
            </button>
            <button
              onClick={() => handleRateConfidence(3)}
              className="py-3 px-4 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-200 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-md shadow-emerald-950/50"
            >
              <span>3 • High</span>
              <span className="text-[10px] font-normal text-emerald-300">Mastered</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
