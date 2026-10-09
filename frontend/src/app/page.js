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
  AlertTriangle,
  Sparkles,
  Link2,
  ListPlus,
  Upload,
  X,
  Layers,
} from 'lucide-react';

// ─── URL Validation ───────────────────────────────────────────────────────────
// Blocks SSRF vectors: private IPs, loopback, link-local, internal hostnames,
// non-http(s) schemes, bare IPs, hex/octal/decimal IPs, and bracketed IPv6 addresses.
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,           // 127.x.x.x loopback
  /^10\.\d+\.\d+\.\d+$/,            // 10.x.x.x private
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // 172.16–31.x.x private
  /^192\.168\.\d+\.\d+$/,           // 192.168.x.x private
  /^169\.254\.\d+\.\d+$/,           // 169.254.x.x link-local
  /^::1$/,                          // IPv6 loopback
  /^0:0:0:0:0:0:0:1$/,              // IPv6 uncompressed loopback
  /^fc00:/i,                        // IPv6 unique local
  /^fe80:/i,                        // IPv6 link-local
  /^0\.0\.0\.0$/,
  /^metadata\.google\.internal$/i,  // GCP metadata
  /^169\.254\.169\.254$/,           // AWS/Azure metadata endpoint
  /^0x[0-9a-f]+/i,                  // Hex IP representation (e.g. 0x7f.1, 0x7f000001)
  /^\d+$/,                          // Integer IP representation (e.g. 2130706433)
  /^0[0-7]+/,                       // Octal IP representation
];

/**
 * Validates a company URL for SSRF safety.
 * Returns null if valid, or an error string if invalid.
 */
function validateCompanyUrl(raw) {
  if (!raw || !raw.trim()) return null; // field is optional — empty is fine

  let parsed;
  try {
    const normalised = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    parsed = new URL(normalised);
  } catch {
    return 'Invalid URL format. Example: https://stripe.com/jobs';
  }

  // Only allow http and https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return `URL scheme "${parsed.protocol}" is not allowed. Use https://.`;
  }

  let host = parsed.hostname.toLowerCase();
  // Strip brackets from IPv6 hostnames like "[::1]" -> "::1"
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }

  // Block bare IPv4 / IP addresses entirely (not just private ones)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return 'IP addresses are not allowed. Please enter a public domain name.';
  }

  // Block known private/internal hostnames and IP ranges (including hex/octal/IPv6)
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(host)) {
      return 'Private, loopback, or internal URLs are not allowed.';
    }
  }

  // Must have at least one dot (e.g. "stripe.com") — blocks bare hostnames like "intranet"
  if (!host.includes('.')) {
    return 'URL must be a public domain (e.g. https://stripe.com).';
  }

  return null; // valid
}

// ─── CSV Parser (RFC 4180) ────────────────────────────────────────────────────
// Handles quoted fields that contain commas, newlines, and escaped quotes ("").
// The original code used a naive line.split(',') which broke on any JD text
// containing commas inside a quoted field.
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead: "" is an escaped quote, otherwise it ends the quoted field
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip the second quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }

  fields.push(current.trim()); // push the last field
  return fields;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [inputMode, setInputMode] = useState('single');
  const [queuedRoles, setQueuedRoles] = useState([]);

  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyUrlError, setCompanyUrlError] = useState(''); // inline URL validation error
  const [days, setDays] = useState(7);
  const [seniority, setSeniority] = useState('Senior');

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [stageMessage, setStageMessage] = useState('');
  const [error, setError] = useState('');

  // Validate URL on every change — gives immediate inline feedback
  const handleCompanyUrlChange = (e) => {
    const val = e.target.value;
    setCompanyUrl(val);
    setCompanyUrlError(validateCompanyUrl(val) || '');
  };

  const handleAddToQueue = () => {
    if (!jd.trim()) {
      setError('Please paste a Job Description before adding to queue.');
      return;
    }
    const urlErr = validateCompanyUrl(companyUrl);
    if (urlErr) {
      setError(`Company URL: ${urlErr}`);
      return;
    }
    setQueuedRoles([...queuedRoles, { jd, companyUrl, days }]);
    setJd('');
    setCompanyUrl('');
    setCompanyUrlError('');
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
            parsedRoles = parsed.map((item) => ({
              jd: item.jd || item.jobDescription || item.description || '',
              companyUrl: item.companyUrl || item.company_url || item.company_website || '',
              days: item.days || 7,
            }));
          } else {
            throw new Error('JSON must be an array of roles.');
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter((l) => l.trim());
          const hasHeader =
            lines[0].toLowerCase().includes('jd') ||
            lines[0].toLowerCase().includes('description');
          const dataLines = hasHeader ? lines.slice(1) : lines;

          // FIX: use RFC 4180 parser instead of naive split(',')
          // This correctly handles JD text that contains commas inside quoted fields.
          parsedRoles = dataLines.map((line) => {
            const parts = parseCSVLine(line);
            return {
              jd: parts[0] || '',
              companyUrl: parts[1] || '',
              days: parseInt(parts[2], 10) || 7,
            };
          });
        } else {
          throw new Error('Unsupported file format. Please upload JSON or CSV.');
        }

        // Filter out roles with invalid/unsafe URLs and warn about them
        const skipped = [];
        const validRoles = parsedRoles.filter((r) => {
          if (!r.jd || !r.jd.trim()) return false;
          const urlErr = validateCompanyUrl(r.companyUrl);
          if (urlErr) {
            skipped.push(`Row skipped — ${urlErr}`);
            return false;
          }
          return true;
        });

        if (skipped.length > 0) {
          setError(`${skipped.length} row(s) skipped due to invalid URLs: ${skipped[0]}`);
        }

        if (validRoles.length > 0) {
          setQueuedRoles([...queuedRoles, ...validRoles]);
          if (skipped.length === 0) setError('');
        } else {
          setError('No valid roles found in the uploaded file.');
        }
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
      }
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
      // Validate URL before sending to backend
      const urlErr = validateCompanyUrl(companyUrl);
      if (urlErr) {
        setError(`Company URL: ${urlErr}`);
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error(`Server returned error status ${response.status}`);

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
    <div className="space-y-8 text-slate-900 dark:text-slate-100 font-sans">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO DASHBOARD</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 tracking-tight">
              Create interview kit
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              V2.4 COMPILER
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Avg. Gen: 3.2s</span>
          </div>
        </div>

        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Turn a raw job description into a high-signal technical roadmap with targeted algorithmic
          archetypes, system blueprints, and precision pacing.
        </p>
      </div>

      {/* ── Mode Toggle ──────────────────────────────────────── */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full max-w-sm border border-slate-200 dark:border-slate-700 shadow-inner">
        <button
          onClick={() => setInputMode('single')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
            inputMode === 'single'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Single Role
        </button>
        <button
          onClick={() => setInputMode('batch')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
            inputMode === 'batch'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Batch Multiple Roles
        </button>
      </div>

      <ErrorAlert message={error} />

      <form
        onSubmit={inputMode === 'single' ? handleSubmit : (e) => e.preventDefault()}
        className="space-y-6"
      >
        {/* Batch file upload */}
        {inputMode === 'batch' && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Upload a roles file
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400 max-w-md">
                Upload a <code>.json</code> or <code>.csv</code> file containing an array of roles
                (fields: jd, companyUrl, days).
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
                className="cursor-pointer bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 font-bold py-2 px-4 rounded-lg text-xs shadow-sm transition-colors"
              >
                Browse File
              </label>
            </div>
          </div>
        )}

        {/* Job Description */}
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

        {/* Company URL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <label className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                Company website or careers URL
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Optional
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              CRAWLER: ACTIVE
            </span>
          </div>
          <div className="relative">
            <Link2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
            <input
              type="url"
              value={companyUrl}
              onChange={handleCompanyUrlChange}
              placeholder="https://stripe.com/jobs"
              className={`w-full bg-white dark:bg-slate-800 border rounded-lg pl-9 pr-10 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors ${
                companyUrlError
                  ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500'
              }`}
            />
            {/* Show check if valid and non-empty, warning icon if invalid */}
            {companyUrl && !companyUrlError && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
            )}
            {companyUrl && companyUrlError && (
              <AlertTriangle className="w-4 h-4 text-rose-500 absolute right-3 top-3" />
            )}
          </div>
          {/* Inline validation message */}
          {companyUrlError && (
            <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {companyUrlError}
            </p>
          )}
        </div>

        {/* Days + Seniority grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Days before interview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Days before interview</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-xs text-slate-800 dark:text-slate-200">
              <button
                type="button"
                onClick={() => handleStepper(-1)}
                className="w-8 h-7 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                -
              </button>
              <span>{days} days window</span>
              <button
                type="button"
                onClick={() => handleStepper(1)}
                className="w-8 h-7 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Seniority */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                Target Seniority Level
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-semibold">
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
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Batch queue */}
        {inputMode === 'batch' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleAddToQueue}
              className="w-full py-3 px-6 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ListPlus className="w-4 h-4" />
              <span>Add to Batch Queue</span>
            </button>

            {queuedRoles.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Queued Roles ({queuedRoles.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setQueuedRoles([])}
                    className="text-[10px] text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold cursor-pointer"
                  >
                    CLEAR ALL
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {queuedRoles.map((role, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex justify-between items-center shadow-xs"
                    >
                      <div className="truncate pr-4">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          {role.companyUrl
                            ? new URL(
                                role.companyUrl.startsWith('http')
                                  ? role.companyUrl
                                  : `https://${role.companyUrl}`
                              ).hostname
                            : 'Unknown Company'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                          {role.jd.substring(0, 100)}...
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(idx)}
                        className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="space-y-2">
          {inputMode === 'batch' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isGenerating || queuedRoles.length === 0}
              className="w-full py-3.5 px-6 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                Generate{' '}
                {queuedRoles.length > 0 ? `${queuedRoles.length} Kits` : 'Kits'} (Batch Process)
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 px-6 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate interview kit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 text-center">
            {inputMode === 'batch'
              ? 'Automatically researches companies, evaluates required gaps, and pipelines multiple kits.'
              : 'Researches company stack, creates custom challenges, evaluates gap coverage, and generates daily spaced-repetition roadmap.'}
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
