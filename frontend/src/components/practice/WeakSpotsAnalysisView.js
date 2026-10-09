'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { AlertTriangle, CheckCircle2, Play, Target } from 'lucide-react';

export function WeakSpotsAnalysisView({ kitId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeakSpots() {
      try {
        const res = await api.get(`/practice/weak-spots/${kitId}`);
        if (res.data.status === 'ok') {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch weak spots:', err);
      } finally {
        setLoading(false);
      }
    }
    if (kitId) {
      fetchWeakSpots();
    }
  }, [kitId]);

  if (loading) {
    return (
      <div className="space-y-4 font-mono">
        <LoadingSkeleton className="h-6 w-48 bg-slate-200" />
        <LoadingSkeleton className="h-32 w-full bg-slate-200" />
      </div>
    );
  }

  const weakCards = data?.weakFlashcards || [];
  const weakReqs = data?.weakRequirements || [];

  return (
    <div className="space-y-8 font-sans text-slate-900">
      {/* Header */}
      <div className="space-y-1 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold font-serif text-slate-900 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span>Your Weak Spots</span>
        </h2>
        <p className="text-xs font-mono text-slate-500">
          Focus your remaining preparation time where it matters most.
        </p>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Needs Attention */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold font-serif text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-600" />
            <span>Needs Attention ({weakCards.length + weakReqs.length})</span>
          </h3>

          {weakCards.length === 0 && weakReqs.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-blue-600 font-semibold">
              ✓ No weak spots identified! High confidence scores recorded.
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              {weakCards.map((card, idx) => (
                <div key={card.id || idx} className="p-3 rounded-lg bg-slate-50 border border-rose-200 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-rose-700">
                      {card.front}
                    </span>
                    <Badge variant="must" size="sm">LOW CONFIDENCE</Badge>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{card.back}</p>
                </div>
              ))}

              {weakReqs.map((req, idx) => (
                <div key={req.id || idx} className="p-3 rounded-lg bg-slate-50 border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-700">
                      Requirement: {req.text}
                    </span>
                    <Badge variant="nice" size="sm">UNPRACTICED</Badge>
                  </div>
                  <p className="text-slate-500 text-[11px]">Category: {req.kind || 'technical'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Focus Plan */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold font-serif text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Recommended Focus Strategy</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-bold text-blue-600 block">1. Review Low Confidence Flashcards</span>
              <p className="text-slate-600">Re-test yourself on low confidence flashcards until answer outlines can be recalled within 10 seconds.</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-bold text-blue-600 block">2. Practice Mandatory Requirements</span>
              <p className="text-slate-600">Review assigned questions under MUST-priority requirements in your question bank.</p>
            </div>

            <div className="pt-2">
              <Link href={`/practice/${kitId}`}>
                <Button variant="primary" size="sm" className="w-full">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Practice Session</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
