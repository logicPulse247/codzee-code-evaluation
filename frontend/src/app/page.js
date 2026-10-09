'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { ProgressPipeline } from '../components/kit/ProgressPipeline';
import { Textarea } from '../components/ui/Textarea';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Calendar,
  Zap,
  CheckCircle2,
  Sliders,
  Sparkles,
  Link2,
  ListPlus,
  Upload,
  X,
  Layers
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [inputMode, setInputMode] = useState('single'); // 'single' or 'batch'
  const [queuedRoles, setQueuedRoles] = useState([]);
  
  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [days, setDays] = useState(7);
  const [seniority, setSeniority] = useState('Senior');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [stageMessage, setStageMessage] = useState('');
  const [error, setError] = useState('');

  const handleAddToQueue = () => {
    if (!jd.trim()) {
      setError('Please paste a Job Description before adding to queue.');
      return;
    }
    setQueuedRoles([...queuedRoles, { jd, companyUrl, days }]);
    setJd('');
    setCompanyUrl('');
    setError('');
  };

  const handleRemoveFromQueue = (index) => {
    setQueuedRoles(queuedRoles.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let parsedRoles = [];
        
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            parsedRoles = parsed.map(item => ({
              jd: item.jd || item.jobDescription || item.description || '',
              companyUrl: item.companyUrl || item.company_url || item.company_website || '',
              days: item.days || 7
            }));
          } else {
            throw new Error('JSON must be an array of roles.');
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter(l => l.trim());
          // Basic CSV parsing assuming headers: jd,companyUrl,days or similar. Skip header if it looks like one.
          const hasHeader = lines[0].toLowerCase().includes('jd') || lines[0].toLowerCase().includes('description');
          const dataLines = hasHeader ? lines.slice(1) : lines;
          
          parsedRoles = dataLines.map(line => {
            // Simple split by comma (doesn't handle commas inside quotes perfectly, but good enough for simple CSV)
            const parts = line.split(',');
            return {
              jd: parts[0] || '',
              companyUrl: parts[1] || '',
              days: parseInt(parts[2], 10) || 7
            };
          });
        } else {
          throw new Error('Unsupported file format. Please upload JSON or CSV.');
        }

        const validRoles = parsedRoles.filter(r => r.jd && r.jd.trim());
        if (validRoles.length > 0) {
          setQueuedRoles([...queuedRoles, ...validRoles]);
          setError('');
        } else {
          setError('No valid roles found in the uploaded file.');
        }
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
      }
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      router.push('/login?redirect=/');
      return;
    }

    let payload = {};
    let endpoint = '';

    if (inputMode === 'single') {
      if (!jd.trim()) {
        setError('Please paste a Job Description.');
        return;
      }
      endpoint = '/kits/generate';
      payload = { jd, company_url: companyUrl, days: Number(days) };
    } else {
      if (queuedRoles.length === 0) {
        setError('Please add at least one role to the queue.');
        return;
      }
      endpoint = '/kits/batch-generate';
      payload = { roles: queuedRoles };
    }

    setError('');
    setIsGenerating(true);
    setCurrentStage('INITIALIZING');
    setStageMessage('Initializing pipeline...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace(/^data:\s*/, '').trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'progress') {
                setCurrentStage(parsed.stage);
                setStageMessage(parsed.message);
              } else if (parsed.type === 'complete') {
                setIsGenerating(false);
                if (inputMode === 'single') {
                  router.push(`/kit/${parsed.kit._id}`);
                } else {
                  router.push('/dashboard');
                }
                return;
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message);
              }
            } catch (pErr) {
              console.error('SSE JSON parse error:', pErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Kit Generation Error:', err);
      setError(err.message || 'Failed to generate kit.');
      setIsGenerating(false);
    }
  };

  const handleStepper = (delta) => {
    const next = Math.max(1, Math.min(60, Number(days) + delta));
    setDays(next);
  };

  return (
    <div className="space-y-8 text-slate-900 font-sans">
      {/* Top Header & Back Link */}
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO DASHBOARD</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">
              Create interview kit
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              V2.4 COMPILER
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-xs">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Avg. Gen: 3.2s</span>
          </div>
        </div>

        <p className="text-xs font-mono text-slate-500 max-w-2xl leading-relaxed">
          Turn a raw job description into a high-signal technical roadmap with targeted algorithmic archetypes, system blueprints, and precision pacing.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-sm border border-slate-200 shadow-inner">
        <button
          onClick={() => setInputMode('single')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
            inputMode === 'single'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Single Role
        </button>
        <button
          onClick={() => setInputMode('batch')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
            inputMode === 'batch'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Batch Multiple Roles
        </button>
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={inputMode === 'single' ? handleSubmit : (e) => e.preventDefault()} className="space-y-6">
        
        {inputMode === 'batch' && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload a roles file
              </h3>
              <p className="text-xs text-blue-700 max-w-md">
                Upload a `.json` or `.csv` file containing an array of roles (fields: jd, companyUrl, days). We'll automatically queue them for generation.
              </p>
            </div>
            <div>
              <input 
                type="file" 
                accept=".json,.csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden" 
                id="file-upload" 
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold py-2 px-4 rounded-lg text-xs shadow-sm transition-colors"
              >
                Browse File
              </label>
            </div>
          </div>
        )}

        {/* Card 1: Job Description Code Window */}
        <Textarea
          label="Job description"
          badgeText="Required"
          filename="spec_manifest.txt"
          rows={7}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          onClear={() => setJd('')}
          placeholder="Senior Full Stack Engineer responsible for microservices, React 19 architecture, Node.js concurrency..."
        />

        {/* Card 2: Company Website or Careers URL */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <label className="text-xs font-bold font-mono text-slate-800">
                Company website or careers URL
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                Optional
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              CRAWLER: ACTIVE
            </span>
          </div>
          <div className="relative">
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="https://stripe.com/jobs"
              className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg pl-9 pr-10 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
            {companyUrl && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 absolute right-3 top-3" />
            )}
          </div>
        </div>

        {/* Card 3: Grid Row (Days before interview & Seniority Level) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Days before interview */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-slate-800 flex items-center gap-2">
                <span>Days before interview</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[3, 7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`py-1.5 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                    Number(days) === d
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800">
              <button
                type="button"
                onClick={() => handleStepper(-1)}
                className="w-8 h-7 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer"
              >
                -
              </button>
              <span>{days} days window</span>
              <button
                type="button"
                onClick={() => handleStepper(1)}
                className="w-8 h-7 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Target Seniority Level */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-slate-800">
                Target Seniority Level
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                CALIBRATED
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['Junior', 'Mid', 'Senior', 'Staff+'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeniority(lvl)}
                  className={`py-1.5 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                    seniority === lvl
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Batch Queue view and actions */}
        {inputMode === 'batch' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleAddToQueue}
              className="w-full py-3 px-6 rounded-lg text-sm font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ListPlus className="w-4 h-4" />
              <span>Add to Batch Queue</span>
            </button>

            {queuedRoles.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                    Queued Roles ({queuedRoles.length})
                  </h4>
                  <button type="button" onClick={() => setQueuedRoles([])} className="text-[10px] text-red-500 hover:text-red-700 font-bold cursor-pointer">
                    CLEAR ALL
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {queuedRoles.map((role, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-xs">
                      <div className="truncate pr-4">
                        <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          {role.companyUrl ? new URL(role.companyUrl.startsWith('http') ? role.companyUrl : `https://${role.companyUrl}`).hostname : 'Unknown Company'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-1">
                          {role.jd.substring(0, 100)}...
                        </div>
                      </div>
                      <button type="button" onClick={() => handleRemoveFromQueue(idx)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Action CTA */}
        <div className="space-y-2">
          {inputMode === 'batch' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isGenerating || queuedRoles.length === 0}
              className="w-full py-3.5 px-6 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate {queuedRoles.length > 0 ? `${queuedRoles.length} Kits` : 'Kits'} (Batch Process)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 px-6 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate interview kit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <p className="text-[11px] font-mono text-slate-500 text-center">
            {inputMode === 'batch' 
              ? 'Automatically researches companies, evaluates required gaps, and pipelines multiple kits.'
              : 'Researches company stack, creates custom challenges, evaluates gap coverage, and generates daily spaced-repetition roadmap.'
            }
          </p>
        </div>
      </form>

      <ProgressPipeline
        isOpen={isGenerating}
        currentStage={currentStage}
        message={stageMessage}
        error={error}
        onClose={() => setIsGenerating(false)}
      />
    </div>
  );
}
