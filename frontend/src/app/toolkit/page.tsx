'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/services/api';

interface ToolField {
  name: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'textarea';
  required?: boolean;
}

interface Tool {
  id: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  fields: ToolField[];
}

const TOOLS: Tool[] = [
  {
    id: 'lesson-plan',
    name: 'Lesson Plan',
    tagline: 'A timed, objective-driven plan for any topic.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
    fields: [
      { name: 'topic', label: 'Topic', placeholder: 'e.g. Photosynthesis', required: true },
      { name: 'gradeLevel', label: 'Grade / Level', placeholder: 'e.g. Class 8' },
      { name: 'duration', label: 'Class Duration', placeholder: 'e.g. 45 minutes' },
    ],
  },
  {
    id: 'rubric',
    name: 'Rubric Generator',
    tagline: 'A clear grading rubric with performance levels.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    ),
    fields: [
      { name: 'assignmentTitle', label: 'Assignment', placeholder: 'e.g. Essay on Climate Change', required: true },
      { name: 'criteria', label: 'Criteria (optional)', placeholder: 'e.g. structure, evidence, grammar' },
      { name: 'maxPoints', label: 'Total Points', placeholder: 'e.g. 100' },
    ],
  },
  {
    id: 'concept-explainer',
    name: 'Concept Explainer',
    tagline: 'Simple explanation with analogy & misconceptions.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    ),
    fields: [
      { name: 'concept', label: 'Concept', placeholder: 'e.g. Recursion', required: true },
      { name: 'audience', label: 'Audience', placeholder: 'e.g. first-year CS students' },
    ],
  },
  {
    id: 'quiz-from-notes',
    name: 'Quiz from Notes',
    tagline: 'Turn study notes into a quiz with an answer key.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    fields: [
      { name: 'notes', label: 'Study Notes', placeholder: 'Paste your notes here...', type: 'textarea', required: true },
      { name: 'numQuestions', label: 'Number of Questions', placeholder: 'e.g. 5' },
    ],
  },
];

export default function ToolkitPage() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const openTool = (tool: Tool) => {
    setActiveTool(tool);
    setInputs({});
    setResult('');
    setError('');
    setCopied(false);
  };

  const closeTool = () => {
    setActiveTool(null);
    setResult('');
    setError('');
  };

  const handleGenerate = async () => {
    if (!activeTool) return;
    const primary = activeTool.fields[0];
    if (primary.required && !inputs[primary.name]?.trim()) {
      setError(`${primary.label} is required.`);
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    const res = await api.runToolkitTool(activeTool.id, inputs);
    setLoading(false);
    if (res.success && res.data) {
      setResult(res.data.result);
    } else {
      setError(res.error || "This request couldn't be fulfilled. Please try again in a few moments.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTool?.id || 'veda-ai'}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell activeItem="toolkit" title="AI Teacher's Toolkit">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff7a59]" />
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">AI Teacher&apos;s Toolkit</h1>
        </div>
        <p className="text-sm text-zinc-400 font-semibold mb-6 ml-5.5">
          Quick AI helpers for everyday teaching tasks.
        </p>

        {!activeTool ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => openTool(tool)}
                className="text-left bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-2xl bg-zinc-900 group-hover:bg-[#ff7a59] flex items-center justify-center mb-4 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {tool.icon}
                  </svg>
                </div>
                <h3 className="text-sm font-extrabold text-zinc-900 mb-1">{tool.name}</h3>
                <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">{tool.tagline}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Input panel */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs h-fit">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-extrabold text-zinc-900">{activeTool.name}</h2>
                <button
                  onClick={closeTool}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  ← All tools
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {activeTool.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={inputs[field.name] || ''}
                        onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={6}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all text-sm font-medium resize-y"
                      />
                    ) : (
                      <input
                        type="text"
                        value={inputs[field.name] || ''}
                        onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all text-sm font-semibold"
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full mt-2 py-3 px-6 bg-[#ff7a59] hover:bg-[#fa6a47] text-white font-bold rounded-full shadow-md shadow-[#ff7a59]/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
            </div>

            {/* Result panel */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs min-h-72 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-zinc-900">Result</h2>
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-9 h-9 rounded-full border-4 border-[#ff7a59]/20 border-t-[#ff7a59] animate-spin mb-3" />
                  <p className="text-xs text-zinc-400 font-semibold">Lumina AI is thinking...</p>
                </div>
              ) : result ? (
                <pre className="flex-1 whitespace-pre-wrap text-sm text-zinc-800 font-sans leading-relaxed overflow-y-auto">
                  {result}
                </pre>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                  <p className="text-xs text-zinc-400 font-semibold max-w-xs">
                    Fill in the fields and hit Generate — your result will appear here, ready to copy or download.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
