'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import DifficultyBadge, { Difficulty } from '@/components/DifficultyBadge';
import { socketService } from '@/services/socket';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useNotifications } from '@/context/NotificationContext';

interface Question {
  text: string;
  type: string;
  difficulty: string;
  marks: number;
  options?: string[];
}

interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

interface AssignmentData {
  _id: string;
  title: string;
  subject: string;
  difficulty: string;
  timeLimit: number;
  totalMarks: number;
  totalQuestions: number;
  sections?: Section[];
  dueDate?: string;
  status: string;
  additionalInfo?: string;
  questionRows?: any[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OutputPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, logout } = useAuth();

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
  const [showMobileNotifDropdown, setShowMobileNotifDropdown] = useState(false);

  // Customizer/UI states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [fontSizeClass, setFontSizeClass] = useState('paper-font-m');
  const [showMobileProfileDropdown, setShowMobileProfileDropdown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Student info values
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [section, setSection] = useState('');

  const generationSteps = [
    'Parsing reference materials...',
    'Structuring custom question paper schema...',
    'Generating questions using Veda AI model...',
    'Formulating answers and rubrics...',
    'Finalizing assignment output...',
  ];

  const fetchAssignment = async () => {
    setLoading(true);
    setError(null);
    const res = await api.getAssignmentById(id);
    if (res.success && res.data) {
      setAssignment(res.data as any);
    } else {
      setError(res.error || 'Failed to load assignment');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  // Save changes locally and to MongoDB
  const handleSaveChanges = async () => {
    if (!assignment) return;
    setIsSaving(true);
    
    // Recalculate totals
    let calculatedQuestions = 0;
    let calculatedMarks = 0;
    if (assignment.sections) {
      assignment.sections.forEach(sec => {
        calculatedQuestions += sec.questions.length;
        sec.questions.forEach(q => {
          calculatedMarks += Number(q.marks || 0);
        });
      });
    }

    const updatedAssignment = {
      ...assignment,
      totalQuestions: calculatedQuestions || assignment.totalQuestions,
      totalMarks: calculatedMarks || assignment.totalMarks
    };

    const res = await api.updateAssignment(id, updatedAssignment);
    if (res.success && res.data) {
      setAssignment(res.data as any);
      setIsEditMode(false);
    } else {
      alert(res.error || 'Failed to save updates to the server');
    }
    setIsSaving(false);
  };

  // Modify local state on text edit
  const handleMetadataChange = (field: keyof AssignmentData, value: any) => {
    if (!assignment) return;
    setAssignment({
      ...assignment,
      [field]: value
    });
  };

  const handleSectionChange = (sIdx: number, field: keyof Section, value: any) => {
    if (!assignment || !assignment.sections) return;
    const nextSections = [...assignment.sections];
    nextSections[sIdx] = {
      ...nextSections[sIdx],
      [field]: value
    };
    setAssignment({
      ...assignment,
      sections: nextSections
    });
  };

  const handleQuestionChange = (sIdx: number, qIdx: number, field: keyof Question, value: any) => {
    if (!assignment || !assignment.sections) return;
    const nextSections = [...assignment.sections];
    const nextQuestions = [...nextSections[sIdx].questions];
    nextQuestions[qIdx] = {
      ...nextQuestions[qIdx],
      [field]: value
    };
    nextSections[sIdx] = {
      ...nextSections[sIdx],
      questions: nextQuestions
    };
    setAssignment({
      ...assignment,
      sections: nextSections
    });
  };

  const handleOptionChange = (sIdx: number, qIdx: number, oIdx: number, value: string) => {
    if (!assignment || !assignment.sections) return;
    const nextSections = [...assignment.sections];
    const nextQuestions = [...nextSections[sIdx].questions];
    const nextOptions = [...(nextQuestions[qIdx].options || [])];
    nextOptions[oIdx] = value;
    nextQuestions[qIdx] = {
      ...nextQuestions[qIdx],
      options: nextOptions
    };
    nextSections[sIdx] = {
      ...nextSections[sIdx],
      questions: nextQuestions
    };
    setAssignment({
      ...assignment,
      sections: nextSections
    });
  };

  const handleRegenerate = async () => {
    if (!assignment) return;
    const confirmed = confirm('Are you sure you want to regenerate this question paper? This will overwrite the current questions.');
    if (!confirmed) return;

    setIsRegenerating(true);
    setGenerationStep(0);

    const payload = {
      title: assignment.title || '',
      subject: assignment.subject || '',
      difficulty: (assignment.difficulty || 'medium').toLowerCase() as "easy" | "medium" | "hard",
      timeLimit: Number(assignment.timeLimit || 60),
      dueDate: assignment.dueDate || '',
      questionRows: assignment.questionRows || [
        { type: 'mcq', count: 4, marks: 1 },
        { type: 'short', count: 3, marks: 2 }
      ],
      additionalInfo: assignment.additionalInfo || '',
    };

    const res = await api.generateAssignment(payload);
    if (!res.success || !res.data) {
      alert(res.error || 'Failed to start regeneration');
      setIsRegenerating(false);
      return;
    }

    const { assignmentId } = res.data as any;

    if (!user) return;
    socketService.connect(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080");
    socketService.emit('subscribe', { userId: user._id });

    const unsubProgress = socketService.on('job:progress', (data: any) => {
      if (data.assignmentId === assignmentId) {
        setGenerationStep(data.step);
      }
    });

    const unsubDone = socketService.on('job:done', (data: any) => {
      if (data.assignmentId === assignmentId) {
        unsubProgress();
        unsubDone();
        unsubFailed();
        setIsRegenerating(false);
        router.push(`/output/${assignmentId}`);
      }
    });

    const unsubFailed = socketService.on('job:failed', (data: any) => {
      if (data.assignmentId === assignmentId) {
        unsubProgress();
        unsubDone();
        unsubFailed();
        setIsRegenerating(false);
        alert(data.error || 'Regeneration failed.');
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100 font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-[#ff7a59] animate-spin mb-6" />
        <p className="text-zinc-400 text-sm font-semibold tracking-wide">Loading generated assessment...</p>
      </div>
    );
  }

  if (isRegenerating) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto px-6 font-sans">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-850 border-t-[#ff7a59] animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-zinc-100 mb-2">Regenerating with Veda AI</h3>
        <p className="text-xs text-[#ff7a59] font-semibold animate-pulse">{generationSteps[generationStep]}</p>
        
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-6 border border-zinc-800">
          <div
            className="h-full bg-[#ff7a59] transition-all duration-300"
            style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100 p-6 font-sans">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Assignment</h2>
        <p className="text-zinc-550 max-w-md text-center text-sm mb-6 leading-relaxed">{error || 'The requested assignment could not be loaded.'}</p>
        <Link href="/" className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-200 font-bold rounded-full text-xs transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Calculate sum of question count if sections array is present
  const totalQuestionsList = assignment.sections
    ? assignment.sections.reduce((sum, s) => sum + s.questions.length, 0)
    : assignment.totalQuestions;

  // Resolve School details from User Profile
  const schoolName = user?.schoolName
    ? `${user.schoolName}${user.schoolCity ? `, ${user.schoolCity}` : ''}`
    : 'Delhi Public School, Sector-4, Bokaro';

  // Resolve Class/Grade from User Profile
  const userClass = user?.semester || user?.degree || '5th';

  // Dynamic greeting matching CBSE/Chapters setup
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Teacher';
  let classStreamText = '';
  if (user?.degree) {
    classStreamText += user.degree;
  }
  if (user?.semester) {
    classStreamText += classStreamText ? ` (${user.semester})` : user.semester;
  }
  if (user?.specialization) {
    classStreamText += classStreamText ? ` in ${user.specialization}` : user.specialization;
  }
  if (!classStreamText) {
    classStreamText = 'classes';
  } else {
    classStreamText = `${classStreamText} classes`;
  }
  const greetingText = `Certainly, ${firstName}! Here is your customized Question Paper for your ${assignment.subject} ${classStreamText} on "${assignment.title}":`;

  return (
    <div className="min-h-screen bg-zinc-100 flex text-zinc-900 font-sans selection:bg-[#ff7a59] selection:text-white print:bg-white print:text-black">
      
      {/* Sidebar (Hidden during print) */}
      <div className="hidden md:flex no-print">
        <Sidebar activeItem="home" />
      </div>

      {/* Main Container - Right side */}
      <div className="flex-1 flex flex-col min-w-0 print:block">
        
        {/* Desktop Header */}
        <div className="hidden md:block no-print">
          <Header title={assignment?.title || 'Assignment Preview'} showBackButton={true} onBackClick={() => router.push('/')} />
        </div>

        {/* Mobile Header (matching Dashboard layout) */}
        <header className="flex md:hidden items-center justify-between mx-4 mt-4 mb-2 px-4 py-3 bg-white border border-zinc-200/60 rounded-[24px] shadow-sm sticky top-4 z-30 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center font-extrabold text-white text-base shadow-sm">
              V
            </div>
            <span className="font-extrabold text-zinc-900 text-lg tracking-tight">VedaAI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => {
                  setShowMobileNotifDropdown(!showMobileNotifDropdown);
                  markAllAsRead();
                }}
                className="relative w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center transition-colors hover:bg-zinc-100 cursor-pointer"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5 text-zinc-850" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ff7a59] rounded-full border border-white" />
                )}
              </button>
              {showMobileNotifDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2.5 z-50 animate-fadeIn text-left">
                  <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-zinc-800">Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] text-zinc-400 hover:text-zinc-650 font-bold bg-transparent border-none cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-zinc-400 font-medium">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.link) {
                              router.push(n.link);
                            }
                            setShowMobileNotifDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-zinc-50 border-b border-zinc-50 last:border-b-0 cursor-pointer transition-colors"
                        >
                          <div className="text-xs font-bold text-zinc-800 mb-0.5">{n.title}</div>
                          <div className="text-[11px] text-zinc-550 leading-normal font-semibold">{n.body}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMobileProfileDropdown(!showMobileProfileDropdown)}
                className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 shadow-xs flex items-center justify-center flex-shrink-0 cursor-pointer"
                aria-label="Profile"
              >
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center font-extrabold text-[#ff7a59] text-xs">
                    {user?.fullName ? user.fullName.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase() : user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {showMobileProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 border-b border-zinc-100">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Signed in as</p>
                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    {user?.fullName && (
                      <p className="text-xs font-semibold text-zinc-700 truncate mt-0.5">@{user?.username}</p>
                    )}
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setShowMobileProfileDropdown(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Account Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowMobileProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1 text-zinc-900 hover:text-zinc-650 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Workspace Body Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#333333] print:bg-white print:p-0 relative">
          
          {/* Background glowing gradients (web view only) */}
          <div className="absolute top-[5%] left-[5%] w-[40%] h-[40%] rounded-full bg-[#ff7a59]/5 blur-[100px] pointer-events-none no-print" />
          
          <div className="max-w-4xl w-full mx-auto space-y-6 print:block print:space-y-0">
            
            {/* ── Top action bar: back + Edit/Save + Regenerate ── */}
            <div className="flex flex-wrap justify-between items-center gap-2 no-print">
              <Link href="/" className="inline-flex items-center text-xs text-zinc-400 hover:text-[#ff7a59] transition-all font-bold gap-1 hover:-translate-x-0.5">
                <span>←</span>
                <span>Back to Dashboard</span>
              </Link>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Regenerate button */}
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-full text-[11px] font-bold transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Regenerate</span>
                </button>

                {/* Edit / Save toggle */}
                {isEditMode ? (
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#ff7a59] hover:bg-[#ff6a45] disabled:opacity-60 text-white rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-md"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-900 rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-sm border border-zinc-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Paper</span>
                  </button>
                )}
              </div>
            </div>

            {/* Black Header Banner */}
            <div className="w-full bg-[#1b1b1c] border border-zinc-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-xl no-print text-white">
              <p className="text-sm font-semibold leading-relaxed flex-1">
                {greetingText}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {/* Desktop Download pill */}
                <button
                  onClick={handlePrint}
                  className="hidden sm:flex px-5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold rounded-full text-xs transition-all items-center gap-2 cursor-pointer shadow-md active:scale-98"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download as PDF</span>
                </button>
                {/* Mobile circular download */}
                <button
                  onClick={handlePrint}
                  className="flex sm:hidden w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Download PDF"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Paper controls: Instructions toggle + Font size ── */}
            <div className="flex items-center justify-between no-print px-0.5">
              {/* Instructions toggle */}
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  showInstructions
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
              </button>

              {/* Font size controls */}
              <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-700 rounded-full px-2 py-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider pr-1.5">Size</span>
                {(['paper-font-s', 'paper-font-m', 'paper-font-l'] as const).map((cls, i) => (
                  <button
                    key={cls}
                    onClick={() => setFontSizeClass(cls)}
                    className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      fontSizeClass === cls
                        ? 'bg-white text-zinc-900'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    {['S', 'M', 'L'][i]}
                  </button>
                ))}
              </div>
            </div>

            {/* White Question Paper Frame */}
            <div className="w-full bg-white text-black p-8 md:p-14 shadow-2xl rounded-[32px] border border-zinc-200/65 min-h-[1100px] relative font-sans print:shadow-none print:border-none print:p-0 print:rounded-none print:w-full print:bg-white print:text-black">
              
              {/* Watermark badge (web only) */}
              <div className="absolute top-2 right-4 text-[9px] uppercase font-bold text-zinc-400 tracking-wider select-none no-print border border-zinc-200 rounded px-1.5 py-0.5 bg-zinc-50">
                Exam Paper Preview
              </div>

              {/* Exam Title Block */}
              <div className="text-center pb-6 border-b-2 border-black space-y-2">
                <h1 className="text-lg font-black uppercase tracking-widest text-zinc-900 border-none w-full text-center focus:outline-hidden">
                  {schoolName}
                </h1>
                
                <div className="flex justify-center gap-1 font-bold text-sm tracking-wider uppercase text-zinc-850">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={assignment.subject}
                      onChange={(e) => handleMetadataChange('subject', e.target.value)}
                      className="border border-[#ff7a59] bg-orange-50/50 rounded-sm text-center px-2 py-0.5 max-w-64 text-zinc-900 focus:outline-hidden"
                    />
                  ) : (
                    <span>Subject: {assignment.subject}</span>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-4 font-bold text-sm tracking-wider uppercase text-zinc-850">
                  {user?.degree && <span>Degree: {user.degree}</span>}
                  {user?.semester && (
                    <>
                      {user?.degree && <span className="text-zinc-400">•</span>}
                      <span>Semester/Class: {user.semester}</span>
                    </>
                  )}
                  {!user?.degree && !user?.semester && <span>Class: 5th</span>}
                  {user?.specialization && (
                    <>
                      <span className="text-zinc-400">•</span>
                      <span>Specialization: {user.specialization}</span>
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap justify-between items-center text-xs font-bold text-zinc-700 px-4 pt-1">
                  {isEditMode ? (
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <span>Time:</span>
                        <input
                          type="number"
                          value={assignment.timeLimit}
                          onChange={(e) => handleMetadataChange('timeLimit', Number(e.target.value))}
                          className="w-12 text-center border border-[#ff7a59] bg-orange-50/50 rounded-sm px-1 py-0.5 text-xs text-zinc-900 focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Max Marks:</span>
                        <input
                          type="number"
                          value={assignment.totalMarks}
                          onChange={(e) => handleMetadataChange('totalMarks', Number(e.target.value))}
                          className="w-12 text-center border border-[#ff7a59] bg-orange-50/50 rounded-sm px-1 py-0.5 text-xs text-zinc-900 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>Time Allowed: {assignment.timeLimit} Minutes</span>
                      <span>Maximum Marks: {assignment.totalMarks}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Compiler instruction note */}
              <p className="text-[11px] font-bold text-zinc-800 mt-4 leading-normal">
                All questions are compulsory unless stated otherwise.
              </p>

              {/* Student Info Block */}
              <div className="mt-5 space-y-2 text-xs font-bold text-black select-none">
                <div className="flex items-center gap-2 max-w-xs">
                  <span className="shrink-0">Name:</span>
                  <input
                    type="text"
                    placeholder="________________________"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-hidden text-xs font-medium placeholder-zinc-400 print:placeholder-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 max-w-xs">
                  <span className="shrink-0">Roll Number:</span>
                  <input
                    type="text"
                    placeholder="__________________"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-hidden text-xs font-medium placeholder-zinc-400 print:placeholder-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 max-w-xs">
                  <span className="shrink-0">Class: {userClass} Section:</span>
                  <input
                    type="text"
                    placeholder="__________"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-hidden text-xs font-medium placeholder-zinc-400 print:placeholder-transparent"
                  />
                </div>
              </div>

              {/* Exam General Instructions */}
              {showInstructions && (
                <div className="mt-5 text-[11px] leading-relaxed text-zinc-850 border-b border-dashed border-zinc-300 pb-4">
                  <h4 className="font-extrabold uppercase tracking-wide text-zinc-900 mb-0.5">General Instructions:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Write your Name, Roll Number, and Section clearly in the spaces provided above.</li>
                    <li>Attempt all sections and questions as specified in the instructions.</li>
                    <li>This question paper contains {totalQuestionsList} questions across {assignment.sections?.length || 0} sections.</li>
                    <li>Read all instructions carefully before writing answers.</li>
                  </ul>
                </div>
              )}

              {/* Sections & Questions Content */}
              <div className={`mt-8 space-y-8 ${fontSizeClass}`}>
                {assignment.sections && assignment.sections.length > 0 ? (
                  assignment.sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-4 break-inside-avoid">
                      
                      {/* Section Header */}
                      <div className="pb-1.5 border-b border-black flex flex-col gap-1 print:flex-row print:items-end print:justify-between">
                        {isEditMode ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleSectionChange(sIdx, 'title', e.target.value)}
                              className="text-sm font-bold uppercase tracking-wider text-zinc-900 border border-[#ff7a59] bg-orange-50/50 rounded-sm px-2 py-0.5 w-full focus:outline-hidden"
                            />
                            <input
                              type="text"
                              value={section.instruction}
                              onChange={(e) => handleSectionChange(sIdx, 'instruction', e.target.value)}
                              placeholder="Section instruction line"
                              className="text-[10px] italic text-zinc-650 border border-[#ff7a59] bg-orange-50/50 rounded-sm px-2 py-0.5 w-full focus:outline-hidden"
                            />
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900">
                              {section.title}
                            </h3>
                            <span className="text-[10px] font-medium text-zinc-650 italic">
                              {section.instruction}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Questions loop */}
                      <div className="space-y-5">
                        {section.questions.map((question, qIdx) => (
                          <div key={qIdx} className="flex gap-4 items-start break-inside-avoid pl-1">
                            <span className="text-xs font-bold text-zinc-800 mt-0.5">
                              Q{qIdx + 1}.
                            </span>
                            
                            <div className="flex-1 space-y-2.5">
                              
                              {/* Question text edit mode vs normal */}
                              <div className="flex items-start justify-between gap-4">
                                {isEditMode ? (
                                  <div className="flex-1 flex gap-2 items-start">
                                    <textarea
                                      value={question.text}
                                      onChange={(e) => handleQuestionChange(sIdx, qIdx, 'text', e.target.value)}
                                      rows={2}
                                      className="flex-1 text-xs border border-[#ff7a59] bg-orange-50/50 rounded-sm p-1.5 focus:outline-hidden font-medium text-zinc-900 resize-y"
                                    />
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Marks</label>
                                      <input
                                        type="number"
                                        value={question.marks}
                                        onChange={(e) => handleQuestionChange(sIdx, qIdx, 'marks', Number(e.target.value))}
                                        className="w-12 text-center text-xs border border-[#ff7a59] bg-orange-50/50 rounded-sm py-1 font-bold text-zinc-900 focus:outline-hidden"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs font-semibold leading-relaxed text-black">
                                      {question.text}
                                    </p>
                                    <span className="text-[10px] font-bold text-zinc-700 shrink-0 select-none">
                                      [{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}]
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Options for MCQ */}
                              {question.options && question.options.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 pl-2">
                                  {question.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="text-xs text-zinc-850 font-medium flex items-center gap-2.5">
                                      <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-extrabold select-none bg-zinc-50 shrink-0">
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      
                                      {isEditMode ? (
                                        <input
                                          type="text"
                                          value={opt.replace(/^[A-D]\.\s*/, '')}
                                          onChange={(e) => handleOptionChange(sIdx, qIdx, oIdx, e.target.value)}
                                          className="flex-1 text-xs border border-[#ff7a59] bg-orange-50/50 rounded-sm px-2 py-0.5 text-zinc-900 focus:outline-hidden"
                                        />
                                      ) : (
                                        <span className="text-zinc-800">{opt.replace(/^[A-D]\.\s*/, '')}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Badge tags (Hidden during print) */}
                              <div className="no-print flex items-center justify-between pt-1.5 border-t border-zinc-100 mt-2">
                                <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                                  Type: {question.type || 'Standard'}
                                </span>
                                <DifficultyBadge difficulty={question.difficulty.toLowerCase() as Difficulty} />
                              </div>

                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-xs text-center italic">No questions have been generated yet.</p>
                )}
              </div>

            </div>
          </div>
        </main>
        
      </div>

      {/* Mobile Sidebar drawer overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden no-print">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Sidebar container */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full shadow-2xl transition-transform duration-300 ease-out z-10">
            {/* Close Button inside drawer */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-800 transition-colors z-20 cursor-pointer"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Sidebar component inside drawer */}
            <div className="h-full overflow-y-auto">
              <Sidebar activeItem="home" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
