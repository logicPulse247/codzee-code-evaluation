'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { WeakSpotsAnalysisView } from '../../../components/practice/WeakSpotsAnalysisView';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Play } from 'lucide-react';

export default function WeakSpotsPage() {
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
        console.error('Failed to load kit for weak spots:', err);
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
      <div className="space-y-4 max-w-4xl mx-auto py-8 font-mono">
        <LoadingSkeleton className="h-6 w-48 bg-slate-200" />
        <LoadingSkeleton className="h-64 w-full bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/kit/${kit?._id}`}>
            <button className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold font-serif text-slate-900 tracking-tight">
              Weak Spots & Strategy Analysis
            </h1>
            <p className="text-xs font-mono text-slate-500">
              {kit?.source?.company} — {kit?.source?.role || kit?.title}
            </p>
          </div>
        </div>

        <Link href={`/practice/${kit?._id}`}>
          <Button variant="primary" size="sm">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Practice Flashcards</span>
          </Button>
        </Link>
      </div>

      <WeakSpotsAnalysisView kitId={kit?._id} />
    </div>
  );
}
