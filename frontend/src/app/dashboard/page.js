'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Plus, Trash2, ExternalLink, Search, Clock, Briefcase } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchKits = async () => {
    try {
      const res = await api.get('/kits');
      if (res.data.status === 'ok') {
        setKits(res.data.kits);
      }
    } catch (err) {
      console.error('Failed to fetch kits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchKits();
    }
  }, [user]);

  const handleDelete = async (e, kitId) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this interview kit?')) return;

    try {
      await api.delete(`/kits/${kitId}`);
      setKits(kits.filter(k => k._id !== kitId));
    } catch (err) {
      alert('Failed to delete kit.');
    }
  };

  const filteredKits = kits.filter(k =>
    (k.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.source?.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.source?.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Recently';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton className="h-8 w-64 bg-slate-200" />
          <LoadingSkeleton className="h-4 w-96 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton className="h-40 w-full bg-slate-200" />
          <LoadingSkeleton className="h-40 w-full bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-slate-900">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Engineer'}
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            Continue preparing for your upcoming technical interviews.
          </p>
        </div>

        <Link href="/">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" />
            <span>Create Interview Kit</span>
          </Button>
        </Link>
      </div>

      {/* Main Kits Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Interview Kits</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {kits.length}
            </span>
          </h2>

          {kits.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search company or role..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Empty State */}
        {kits.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No interview kits yet"
            description="Create your first preparation kit from a job description and company website."
            actionLabel="Create Interview Kit"
            onAction={() => router.push('/')}
          />
        ) : filteredKits.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-slate-500">
            No interview kits match your search query "{searchTerm}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKits.map((kit) => (
              <div
                key={kit._id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-xs transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold font-serif text-base text-slate-900 line-clamp-1">
                        {kit.source?.company || 'Company'}
                      </h3>
                      <p className="text-xs font-mono text-blue-600 font-semibold mt-0.5">
                        {kit.source?.role || kit.title}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, kit._id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete Kit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
                    <span className="text-slate-700">
                      {kit.schedule?.days_available || 5} days timeline
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Updated {formatDate(kit.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {kit.questions?.length || 0} Questions
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {kit.flashcards?.length || 0} Cards
                    </span>
                  </div>

                  <Link href={`/kit/${kit._id}`}>
                    <Button variant="secondary" size="sm">
                      <span>Open Kit</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
