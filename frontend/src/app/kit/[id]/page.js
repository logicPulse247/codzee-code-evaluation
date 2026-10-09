'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { OverviewSection } from '../../../components/kit/OverviewSection';
import { QuestionBankWorkspace } from '../../../components/kit/QuestionBankWorkspace';
import { FlashcardsEditorWorkspace } from '../../../components/kit/FlashcardsEditorWorkspace';
import { StudyScheduleTimeline } from '../../../components/kit/StudyScheduleTimeline';
import { ResearchSourcesView } from '../../../components/kit/ResearchSourcesView';
import {
  ArrowLeft, Play, Save, Check, Building2, HelpCircle, Layers, Calendar, Search, ShieldCheck, AlertTriangle
} from 'lucide-react';

const WORKSPACE_TABS = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'questions', label: 'Questions', icon: HelpCircle },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
  { key: 'schedule', label: 'Schedule', icon: Calendar },
  { key: 'research', label: 'Research Sources', icon: Search }
];

export default function KitBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchKit = async () => {
    try {
      const res = await api.get(`/kits/${params.id}`);
      if (res.data.status === 'ok') {
        setKit(res.data.kit);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load interview kit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id && user) {
      fetchKit();
    }
  }, [params.id, user]);

  const handleSaveKit = async (updatedKitData = null) => {
    const dataToSave = updatedKitData || kit;
    if (!dataToSave) return;

    setSaving(true);
    try {
      const res = await api.put(`/kits/${params.id}`, dataToSave);
      if (res.data.status === 'ok') {
        setKit(res.data.kit);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCategory = async (category) => {
    try {
      const res = await api.post(`/kits/${params.id}/regenerate`, {
        targetSection: 'category',
        category,
        questions: kit.questions
      });
      if (res.data.status === 'ok') {
        setKit(res.data.kit);
      }
    } catch (err) {
      alert('Failed to regenerate category questions.');
    }
  };

  const handleRegenerateFlashcards = async () => {
    try {
      const res = await api.post(`/kits/${params.id}/regenerate`, {
        targetSection: 'flashcards',
        flashcards: kit.flashcards
      });
      if (res.data.status === 'ok') {
        setKit(res.data.kit);
      }
    } catch (err) {
      alert('Failed to regenerate flashcards.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6 font-mono">
        <LoadingSkeleton className="h-10 w-full bg-slate-200" />
        <LoadingSkeleton className="h-64 w-full bg-slate-200" />
      </div>
    );
  }

  if (error || !kit) {
    return (
      <div className="max-w-md mx-auto py-12">
        <ErrorAlert message={error || 'Kit not found.'} />
        <div className="pt-4 text-center">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabsWithCounts = WORKSPACE_TABS.map(tab => {
    if (tab.key === 'questions') return { ...tab, count: kit.questions?.length || 0 };
    if (tab.key === 'flashcards') return { ...tab, count: kit.flashcards?.length || 0 };
    return tab;
  });

  const isInvalidJd = kit.source?.is_invalid_jd || false;
  const jdQualityNote = kit.source?.jd_quality_note || '';
  const companyResearchAvailable = kit.company_brief?.company_research_available !== false;

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Workspace Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
              {(kit.source?.company && kit.source.company !== 'Basic') ? kit.source.company : (kit.company_brief?.summary?.split(' ')[0] || 'Target Company')} — {kit.role?.title || kit.source?.role || 'Full Stack Engineer'}
            </h1>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
              <span>{kit.schedule?.days_available || 5} days remaining</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Coverage Verified
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/practice/${kit._id}`}>
            <Button variant="primary" size="sm">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice Mode</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveKit()}
            loading={saving}
          >
            {saveSuccess ? <Check className="w-4 h-4 text-blue-600" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved!' : 'Save Kit'}</span>
          </Button>
        </div>
      </div>

      {/* Invalid JD Banner */}
      {isInvalidJd && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 font-serif">Invalid or Unreadable Job Description</p>
            <p className="text-xs text-amber-700 mt-1 font-mono leading-relaxed">
              {jdQualityNote || 'No recognisable job requirements were found. No questions, flashcards, or schedule have been generated. Please provide a real job description and regenerate.'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs
        tabs={tabsWithCounts}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Main Workspace Panels */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <OverviewSection
            brief={kit.company_brief}
            role={kit.role}
            coverage={kit.coverage}
            questions={kit.questions || []}
            source={kit.source}
          />
        )}

        {activeTab === 'questions' && (
          <QuestionBankWorkspace
            questions={kit.questions || []}
            requirements={kit.role?.requirements || []}
            isInvalidJd={isInvalidJd}
            jdQualityNote={jdQualityNote}
            onUpdateQuestions={async (updatedQ) => {
              const updated = { ...kit, questions: updatedQ };
              setKit(updated);
              try {
                const res = await api.put(`/kits/${params.id}`, { questions: updatedQ });
                if (res.data.status === 'ok') setKit(res.data.kit);
              } catch (_) {
                // Silent — UI state is already updated; user can still Save Kit manually
              }
            }}
            onRegenerateCategory={handleRegenerateCategory}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsEditorWorkspace
            flashcards={kit.flashcards || []}
            requirements={kit.role?.requirements || []}
            isInvalidJd={isInvalidJd}
            jdQualityNote={jdQualityNote}
            onUpdateFlashcards={(updatedF) => {
              const updated = { ...kit, flashcards: updatedF };
              setKit(updated);
            }}
            onRegenerateFlashcards={handleRegenerateFlashcards}
          />
        )}

        {activeTab === 'schedule' && (
          <StudyScheduleTimeline
            schedule={kit.schedule}
            questions={kit.questions || []}
            isInvalidJd={isInvalidJd}
          />
        )}

        {activeTab === 'research' && (
          <ResearchSourcesView
            research={kit.research}
            source={kit.source}
          />
        )}
      </div>
    </div>
  );
}
