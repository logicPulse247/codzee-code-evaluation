'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { ShieldCheck, Building2, Briefcase, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function OverviewSection({ brief, role, coverage, questions = [], source = {} }) {
  const requirements = role?.requirements || [];
  const mustCount = requirements.filter(r => r.priority === 'must').length;
  const coveredMustCount = requirements.filter(r => {
    if (r.priority !== 'must') return false;
    return questions.some(q => q.requirement_ids?.includes(r.id));
  }).length;

  const isThinJd = source?.is_thin_jd || false;
  const jdQualityNote = source?.jd_quality_note || '';
  const companyResearchAvailable = brief?.company_research_available !== false;
  const dataQuality = source?.data_quality || 'full';

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Thin JD Warning */}
      {isThinJd && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3 items-start shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 font-serif">Thin Job Description Detected</p>
            <p className="text-xs text-amber-700 mt-1 font-mono leading-relaxed">
              {jdQualityNote || 'The job description provided was very short. Only requirements explicitly stated were extracted — no skills were invented.'}
            </p>
          </div>
        </div>
      )}

      {/* No Company Data Warning */}
      {!companyResearchAvailable && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start shadow-xs">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-800 font-serif">No Company Research Available</p>
            <p className="text-xs text-blue-700 mt-1 font-mono leading-relaxed">
              The company site could not be crawled. Company-fit questions and the brief below are based on the job description only — no company details were fabricated.
            </p>
          </div>
        </div>
      )}
      {/* Coverage Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-slate-900">
              {coverage?.must_satisfied !== false ? '100% Must-Have Requirements Covered' : 'Requirement Coverage Pending'}
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              {coveredMustCount} / {mustCount} must-have requirements mapped to interview questions.
            </p>
          </div>
        </div>

        <Badge variant={coverage?.must_satisfied !== false ? 'must' : 'uncovered'} size="lg">
          {coverage?.passes ? `${coverage.passes} Coverage Pass(es)` : 'Verified Coverage'}
        </Badge>
      </div>

      {/* Grid for Company Brief & Role Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Brief */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-serif text-sm border-b border-slate-200 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Company Brief</span>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-700 leading-relaxed">
            <div>
              <span className="font-semibold text-slate-900 block mb-1">Executive Summary</span>
              <p className="text-slate-600">{brief?.summary || 'No company summary available.'}</p>
            </div>

            {brief?.products?.length > 0 && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1">Key Products & Services</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {brief.products.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {brief?.tech_stack_notes && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1">Tech Stack Notes</span>
                <p className="text-slate-600">{brief.tech_stack_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Role Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-serif text-sm border-b border-slate-200 pb-3">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Role Breakdown</span>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-700 leading-relaxed">
            {role?.title && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1">Role Title</span>
                <p className="font-bold text-blue-600">{role.title}</p>
              </div>
            )}

            {role?.responsibilities?.length > 0 && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1">Key Responsibilities</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {role.responsibilities.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Requirements List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold font-serif text-slate-900 border-b border-slate-200 pb-3">
          Extracted Requirements & Question Coverage ({requirements.length})
        </h3>

        <div className="space-y-2.5 font-mono">
          {requirements.map((req) => {
            const mappedQCount = questions.filter(q => q.requirement_ids?.includes(req.id)).length;
            return (
              <div
                key={req.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <Badge variant={req.priority === 'must' ? 'must' : 'nice'} size="sm">
                    {req.priority === 'must' ? 'MUST' : 'NICE TO HAVE'}
                  </Badge>
                  <div>
                    <span className="font-medium text-slate-900">{req.text}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 uppercase tracking-wide">
                      Category: {req.kind || 'technical'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${mappedQCount > 0 ? 'text-blue-600' : 'text-slate-300'}`} />
                  <span>Covered by {mappedQCount} {mappedQCount === 1 ? 'question' : 'questions'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
