'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { PracticeModeSession } from '../../../components/practice/PracticeModeSession';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { ArrowLeft } from 'lucide-react';

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchKit() {
      try {
        const res = await api.get(`/kits/${params.id}`);
        if (res.data.status === 'ok') {
          setKit(res.data.kit);
        }
      } catch (err) {
        console.error('Failed to load kit for practice:', err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id && user) {
      fetchKit();
    }
  }, [params.id, user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 font-mono">
        <LoadingSkeleton className="h-6 w-48 bg-slate-200" />
        <LoadingSkeleton className="h-64 w-full bg-slate-200" />
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="max-w-md mx-auto py-12">
        <ErrorAlert message="Kit not found." />
        <div className="pt-4 text-center font-mono">
          <Link href="/dashboard" className="text-xs text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link href={`/kit/${kit._id}`}>
          <button className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-lg font-bold font-serif text-slate-900 tracking-tight">
            Flashcards Practice Mode
          </h1>
          <p className="text-xs font-mono text-slate-500">
            {kit.source?.company || 'Company'} — {kit.source?.role || kit.title}
          </p>
        </div>
      </div>

      <PracticeModeSession
        kitId={kit._id}
        flashcards={kit.flashcards || []}
        onComplete={() => router.push(`/weak-spots/${kit._id}`)}
      />
    </div>
  );
}
