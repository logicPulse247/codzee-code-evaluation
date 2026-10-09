'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Target, CheckCircle2, BookOpen, Lightbulb, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function WeakSpotsReport({ kitId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await api.get(`/practice/weak-spots/${kitId}`);
        if (res.data.status === 'ok') {
          setReport(res.data.report);
        }
      } catch (err) {
        setError('Complete a practice session to generate weak spots report.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [kitId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span>Analyzing practice session confidence records...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="font-semibold text-slate-200">No practice records available yet.</p>
        <p className="text-xs text-slate-400">Complete at least one Flashcard Practice session to view AI weak spots analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Weak Spots Analytics & Focus Report</h2>
            <p className="text-xs text-slate-400">
              Analyzed {report.practiced_cards_count} practiced flashcards
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-semibold text-indigo-300">
          {report.low_confidence_cards.length} Focus Areas Identified
        </div>
      </div>

      {/* Recommended Focus Alert */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-800/50 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Recommended Practice Strategy</h4>
          <p className="text-xs text-slate-200 leading-relaxed">{report.recommended_focus}</p>
        </div>
      </div>

      {/* Weak Requirements */}
      {report.weak_requirements && report.weak_requirements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-rose-400" />
            Weak Role Requirements ({report.weak_requirements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.weak_requirements.map((req) => (
              <div key={req.id} className="p-3 rounded-xl bg-slate-950 border border-rose-900/50 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-rose-300 font-bold bg-rose-950 px-1.5 py-0.5 rounded text-[10px]">
                    {req.id}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{req.kind}</span>
                </div>
                <p className="text-slate-200">{req.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Confidence Flashcards */}
      {report.low_confidence_cards && report.low_confidence_cards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400" />
            Low-Confidence Flashcards ({report.low_confidence_cards.length})
          </h3>
          <div className="space-y-2">
            {report.low_confidence_cards.map((card) => (
              <div key={card.id} className="p-3 rounded-xl bg-slate-950 border border-amber-900/40 text-xs flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-amber-400 font-bold block text-[10px]">{card.id}</span>
                  <p className="text-slate-200 font-semibold">{card.front}</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 text-[10px] font-bold shrink-0">
                  Confidence: {card.confidence || 0}/3
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
