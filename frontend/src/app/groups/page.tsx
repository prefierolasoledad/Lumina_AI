'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/AppShell';
import { api } from '@/services/api';

interface Group {
  _id: string;
  name: string;
  grade: string;
  subject: string;
  description: string;
  studentCount: number;
  color: string;
}

const COLORS: Record<string, { dot: string; tag: string }> = {
  indigo: { dot: 'bg-indigo-500', tag: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  emerald: { dot: 'bg-emerald-500', tag: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  orange: { dot: 'bg-[#ff7a59]', tag: 'bg-orange-50 text-[#ff7a59] border-orange-100' },
  purple: { dot: 'bg-purple-500', tag: 'bg-purple-50 text-purple-600 border-purple-100' },
  sky: { dot: 'bg-sky-500', tag: 'bg-sky-50 text-sky-600 border-sky-100' },
};

const emptyForm = { name: '', grade: '', subject: '', description: '', studentCount: '', color: 'indigo' };

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    const res = await api.listGroups();
    if (res.success && res.data) setGroups(res.data as Group[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchGroups();
  }, [user]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  };

  const openEdit = (g: Group) => {
    setEditingId(g._id);
    setForm({
      name: g.name,
      grade: g.grade || '',
      subject: g.subject || '',
      description: g.description || '',
      studentCount: g.studentCount ? String(g.studentCount) : '',
      color: g.color || 'indigo',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Group name is required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      grade: form.grade,
      subject: form.subject,
      description: form.description,
      studentCount: form.studentCount ? Number(form.studentCount) : 0,
      color: form.color,
    };
    const res = editingId ? await api.updateGroup(editingId, payload) : await api.createGroup(payload);
    setSaving(false);
    if (res.success) {
      setShowModal(false);
      fetchGroups();
    } else {
      setError(res.error || 'Failed to save group.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group? This cannot be undone.')) return;
    const res = await api.deleteGroup(id);
    if (res.success) fetchGroups();
    else alert(res.error || 'Failed to delete group.');
  };

  return (
    <AppShell activeItem="groups" title="My Groups">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">My Groups</h1>
            </div>
            <p className="text-sm text-zinc-400 font-semibold ml-5.5">
              Organize your classes and student cohorts.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-[#ff7a59] hover:bg-[#fa6a47] text-white font-bold rounded-full text-xs transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Group
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 rounded-full border-4 border-[#ff7a59]/20 border-t-[#ff7a59] animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-zinc-700">No groups yet</h3>
            <p className="text-xs text-zinc-400 font-semibold mt-1 mb-5">
              Create a group to organize the classes you teach.
            </p>
            <button
              onClick={openCreate}
              className="px-5 py-2.5 bg-[#ff7a59] hover:bg-[#fa6a47] text-white font-bold rounded-full text-xs transition-colors cursor-pointer"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => {
              const c = COLORS[g.color] || COLORS.indigo;
              return (
                <div
                  key={g._id}
                  className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-44 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />
                        <h3 className="text-sm font-extrabold text-zinc-900 truncate">{g.name}</h3>
                      </div>
                      {g.subject && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border ${c.tag}`}>
                          {g.subject}
                        </span>
                      )}
                    </div>
                    {g.grade && <p className="text-[11px] text-zinc-500 font-bold mb-1">{g.grade}</p>}
                    {g.description && (
                      <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed line-clamp-3">{g.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
                    <span className="text-[11px] text-zinc-500 font-bold inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {g.studentCount} students
                    </span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(g)}
                        className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                        aria-label="Edit group"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(g._id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                        aria-label="Delete group"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-extrabold text-zinc-900 mb-5">
              {editingId ? 'Edit Group' : 'New Group'}
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Field label="Group Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Class 10-A"
                  className="lumina-input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Grade / Level">
                  <input
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    placeholder="e.g. Class 10"
                    className="lumina-input"
                  />
                </Field>
                <Field label="Subject">
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Physics"
                    className="lumina-input"
                  />
                </Field>
              </div>
              <Field label="Students">
                <input
                  type="number"
                  min={0}
                  value={form.studentCount}
                  onChange={(e) => setForm({ ...form, studentCount: e.target.value })}
                  placeholder="e.g. 32"
                  className="lumina-input"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional notes about this group..."
                  rows={3}
                  className="lumina-input resize-y"
                />
              </Field>
              <Field label="Color">
                <div className="flex items-center gap-2.5">
                  {Object.entries(COLORS).map(([key, c]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, color: key })}
                      className={`w-7 h-7 rounded-full ${c.dot} transition-transform ${
                        form.color === key ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : 'hover:scale-105'
                      }`}
                      aria-label={key}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-[#ff7a59] hover:bg-[#fa6a47] text-white font-bold rounded-full text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.lumina-input) {
          width: 100%;
          padding: 0.65rem 1rem;
          background: #fafafa;
          border: 1px solid #e4e4e7;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #18181b;
          transition: all 0.15s;
        }
        :global(.lumina-input:focus) {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );
}
