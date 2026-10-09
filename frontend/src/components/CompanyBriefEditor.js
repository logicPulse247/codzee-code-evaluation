'use client';

import { useState } from 'react';
import { Building2, Globe, RefreshCw, Save, Check, AlertTriangle } from 'lucide-react';

export default function CompanyBriefEditor({ brief, source, onSave, onRegenerate }) {
  const [summary, setSummary] = useState(brief?.summary || '');
  const [whatTheyDo, setWhatTheyDo] = useState(brief?.what_they_do || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const companyResearchAvailable = brief?.company_research_available !== false;

  const handleSave = () => {
    onSave({
      ...brief,
      summary,
      what_they_do: whatTheyDo,
      status: 'edited'
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await onRegenerate('company_brief');
    setIsRegenerating(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">{source?.company || 'Company'} Brief</h2>
              {!companyResearchAvailable && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/60">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Limited Data
                </span>
              )}
            </div>
            {source?.company_url && (
              <a
                href={source.company_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <Globe className="w-3 h-3" />
                {source.company_url}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate Brief
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/20"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved!' : 'Save Brief'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Executive Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            What They Do & Tech Stack
          </label>
          <textarea
            value={whatTheyDo}
            onChange={(e) => setWhatTheyDo(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {source?.pages_used && source.pages_used.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 block mb-2">Sources Researched:</span>
            <div className="flex flex-wrap gap-2">
              {source.pages_used.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-indigo-300 transition-colors truncate max-w-xs"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
