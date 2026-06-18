'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/AppShell';
import { api } from '@/services/api';

interface LibraryItem {
  _id: string;
  title: string;
  subject: string;
  difficulty: string;
  status: string;
  totalMarks: number;
  totalQuestions: number;
  createdAt: string;
  dueDate?: string;
  groupName?: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const res = await api.listAssignments();
      if (res.success && res.data) {
        setItems((res.data as LibraryItem[]).filter((a) => a.status === 'completed'));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const subjects = useMemo(() => {
    const set = new Set(items.map((i) => i.subject).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesSearch =
        !search ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.subject.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || i.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [items, search, subjectFilter]);

  return (
    <AppShell activeItem="library" title="My Library">
      <div className="max-w-6xl mx-auto">
        {/* Page heading */}
        <div className="flex items-center gap-3 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">My Library</h1>
        </div>
        <p className="text-sm text-zinc-400 font-semibold mb-6 ml-5.5">
          Every question paper you&apos;ve generated, in one place.
        </p>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search papers by title or subject..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 transition-all"
            />
          </div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 rounded-2xl text-sm font-semibold text-zinc-700 cursor-pointer"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Subjects' : s}
              </option>
            ))}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-zinc-700">
              {items.length === 0 ? 'No papers yet' : 'No matching papers'}
            </h3>
            <p className="text-xs text-zinc-400 font-semibold mt-1 mb-5">
              {items.length === 0
                ? 'Generate your first question paper to build your library.'
                : 'Try a different search or subject filter.'}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => router.push('/')}
                className="px-5 py-2.5 bg-[#ff7a59] hover:bg-[#fa6a47] text-white font-bold rounded-full text-xs transition-colors cursor-pointer"
              >
                Create Assignment
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item._id}
                onClick={() => router.push(`/output/${item._id}`)}
                className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-36"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-extrabold text-zinc-900 leading-snug line-clamp-2">{item.title}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold whitespace-nowrap border border-emerald-100">
                      {item.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    {item.totalQuestions} questions · {item.totalMarks} marks · {item.difficulty}
                  </p>
                  {item.groupName && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[10px] font-bold">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.groupName}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-400 font-bold">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[11px] text-[#ff7a59] font-bold inline-flex items-center gap-1">
                    Open
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
