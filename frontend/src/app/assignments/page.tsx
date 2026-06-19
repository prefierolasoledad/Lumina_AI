'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/AppShell';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';

interface AssignmentItem {
  _id: string;
  title: string;
  subject: string;
  difficulty: string;
  status: string;
  totalMarks: number;
  totalQuestions: number;
  timeLimit?: number;
  createdAt: string;
  dueDate?: string;
  groupName?: string;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Generated', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  processing: { label: 'In Progress', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  pending: { label: 'Queued', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  failed: { label: 'Failed', cls: 'bg-red-50 text-red-600 border-red-100' },
};

export default function AssignmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'dueDate'>('newest');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchData = async () => {
    const res = await api.listAssignments();
    if (res.success && res.data) setItems(res.data as AssignmentItem[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Live refresh when a generation finishes/fails
    socketService.connect(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000');
    socketService.emit('subscribe', { userId: user._id });
    const unsubDone = socketService.on('job:done', fetchData);
    const unsubFailed = socketService.on('job:failed', fetchData);
    return () => {
      unsubDone();
      unsubFailed();
    };
  }, [user]);

  const filtered = useMemo(() => {
    let list = items.filter(
      (i) =>
        !search ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.subject.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      // dueDate
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    });
    return list;
  }, [items, search, sortBy]);

  const handleDelete = async (id: string) => {
    setActiveMenuId(null);
    if (!confirm('Delete this assignment? This cannot be undone.')) return;
    const res = await api.deleteAssignment(id);
    if (res.success) fetchData();
    else alert(res.error || 'Failed to delete assignment.');
  };

  const fmt = (d?: string) => {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB').replace(/\//g, '-');
  };

  return (
    <AppShell activeItem="assignments" title="Assignments">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20 mt-1 animate-pulse flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">Assignments</h1>
              <p className="text-xs text-zinc-400 mt-0.5">All the question papers you&apos;ve created.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/?create=1')}
            className="px-5 py-2.5 bg-gradient-to-r from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] hover:opacity-95 text-white font-bold rounded-full text-xs transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 shadow-lg shadow-[#f43f8e]/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Assignment
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or subject..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-[#ff7a59] focus:ring-2 focus:ring-[#ff7a59]/10 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-white border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-[#ff7a59] rounded-2xl text-sm font-semibold text-zinc-700 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 rounded-full border-4 border-[#ff7a59]/20 border-t-[#ff7a59] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-zinc-700">
              {items.length === 0 ? 'No assignments yet' : 'No matching assignments'}
            </h3>
            <p className="text-xs text-zinc-400 font-semibold mt-1 mb-5">
              {items.length === 0 ? 'Create your first question paper to get started.' : 'Try a different search.'}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => router.push('/?create=1')}
                className="px-5 py-2.5 bg-gradient-to-r from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] hover:opacity-95 text-white font-bold rounded-full text-xs transition-all cursor-pointer"
              >
                Create Assignment
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((item) => {
              const badge = STATUS_BADGE[item.status] || STATUS_BADGE.completed;
              return (
                <div
                  key={item._id}
                  onClick={() => router.push(`/output/${item._id}`)}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200 relative group flex flex-col justify-between min-h-40 cursor-pointer"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#ff7a59] transition-colors pr-2">
                        {item.title}
                      </h3>
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === item._id ? null : item._id);
                          }}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            activeMenuId === item._id ? 'text-zinc-800 bg-zinc-100' : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'
                          }`}
                          aria-label="More options"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                        {activeMenuId === item._id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-zinc-200/80 rounded-2xl shadow-lg overflow-hidden z-50"
                            >
                              <Link
                                href={`/output/${item._id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View Assignment</span>
                              </Link>
                              <div className="mx-3 border-t border-zinc-100" />
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Subject: {item.subject} • {item.totalMarks} Points • {item.timeLimit || 60} Mins
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>{badge.label}</span>
                      {item.groupName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[10px] font-bold">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {item.groupName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-zinc-100 pt-3 text-zinc-500 mt-4">
                    <div>
                      <span className="font-bold text-zinc-700">Assigned : </span>
                      <span>{fmt(item.createdAt)}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-700">Due : </span>
                      <span>{fmt(item.dueDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
