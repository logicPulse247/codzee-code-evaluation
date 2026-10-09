'use client';

import React from 'react';
import { ExternalLink, Globe, Search, ShieldCheck } from 'lucide-react';

export function ResearchSourcesView({ research, source }) {
  const rawCrawled = research?.crawled_pages || [];
  const crawledPages = rawCrawled.length > 0
    ? rawCrawled
    : (source?.pages_used || []).map(url => ({ url, title: `${source?.company || 'Company'} Web Resource` }));

  const finalCrawledPages = crawledPages.length > 0
    ? crawledPages
    : source?.company_url
    ? [{ url: source.company_url, title: `${source?.company || 'Company'} Official Portal` }]
    : [];

  // Only show actually found process steps — never fabricate defaults
  const processSteps = research?.process_steps || [];
  const hasProcessSteps = processSteps.length > 0;

  // Only show actually found insights — never fabricate defaults
  const insights = research?.insights || [];
  const hasInsights = insights.length > 0;

  const skippedPages = research?.skipped_pages || [];

  // Determine if company research was genuinely available
  const companyResearchAvailable = source?.company_research_available !== false
    && (finalCrawledPages.length > 0 || hasProcessSteps || hasInsights);

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Website Sources */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 font-bold font-serif text-sm text-slate-900">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Company Website Sources</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {finalCrawledPages.length} Verified
            </span>
          </div>

          <div className="space-y-2 font-mono">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Discovered & Crawled Pages ({finalCrawledPages.length}):
            </span>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {finalCrawledPages.map((page, idx) => (
                <a
                  key={idx}
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:border-blue-600 flex items-center justify-between gap-2 text-blue-600 transition-colors"
                >
                  <span className="truncate">{page.title || page.url}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {skippedPages.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2 font-mono">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                <span>Skipped / Unreachable Sources ({skippedPages.length}):</span>
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px]">
                {skippedPages.map((sp, idx) => (
                  <div key={idx} className="p-2 rounded bg-amber-50/60 border border-amber-200 text-amber-900 flex items-center justify-between gap-2">
                    <span className="truncate flex-1">{sp.url}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                      {sp.reason || 'Skipped'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Public Interview Discussion Research */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 font-bold font-serif text-sm text-slate-900">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Public Hiring Process Insights</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {hasProcessSteps ? `${processSteps.length} Rounds` : 'Not Found'}
            </span>
          </div>

          {hasProcessSteps ? (
            <div className="space-y-2 font-mono">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Discovered Interview Rounds:
              </span>
              <div className="space-y-2">
                {processSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block">
                      Round {idx + 1}: {typeof step === 'string' ? step : (step.round_name || `Round ${idx + 1}`)}
                    </span>
                    <p className="text-slate-600 font-sans">{step.description || 'Evaluates core requirements and candidate background.'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 font-mono leading-relaxed">
                No public interview process information was found for this company. The kit's interview questions were generated from the job description only.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Synthesis Key Insights */}
      {hasInsights ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 font-mono">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Key Process Insights & Guidelines:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                • {insight}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2 font-mono">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            Key Process Insights & Guidelines:
          </span>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            No public interview insights or hiring process documentation was found for this company. Review the job description requirements closely — those are the most reliable signal available.
          </p>
        </div>
      )}
    </div>
  );
}
