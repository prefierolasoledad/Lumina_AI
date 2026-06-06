'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const COLLEGE_SEMESTERS = [
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester',
];

const SCHOOL_STREAMS = ['Science', 'Commerce', 'Arts'];

const PRESET_SUBJECTS: Record<string, string[]> = {
  Science: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English'],
  Commerce: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English', 'Informatics Practices'],
  Arts: ['History', 'Geography', 'Political Science', 'Sociology', 'Psychology', 'English', 'Hindi'],
  College: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics',
    'History', 'Geography', 'Political Science', 'English Literature', 'Statistics', 'Management'],
  Default: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature',
    'History', 'Geography', 'Computer Science'],
};

// Helper to detect if a grade is 11th or 12th
const isEleventhOrTwelfth = (grade: string) => {
  const norm = grade.toLowerCase().replace(/\s/g, '');
  return norm.includes('11') || norm.includes('12') || norm.includes('eleventh') || norm.includes('twelfth');
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, logout, updateProfile } = useAuth();

  // Core fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [educationLevel, setEducationLevel] = useState('School');
  const [degree, setDegree] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [semester, setSemester] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [profilePic, setProfilePic] = useState('');

  // Subjects — stored as an array of strings
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const customInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showMobileProfileDropdown, setShowMobileProfileDropdown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Populate form from user context
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setAge(user.age !== undefined && user.age !== null ? user.age : '');
      setGender(user.gender || '');
      setEducationLevel(user.educationLevel || 'School');
      setDegree(user.degree || '');
      setSpecialization(user.specialization || '');
      setSemester(user.semester || '');
      setSchoolName(user.schoolName || '');
      setSchoolCity(user.schoolCity || '');
      setProfilePic(user.profilePic || '');
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#ff7a59]/20 border-t-[#ff7a59] animate-spin" />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Derived state
  // ──────────────────────────────────────────────────────────────────────
  const isCollege = educationLevel === 'College';
  const showStream = !isCollege && isEleventhOrTwelfth(degree);
  const activeStream = SCHOOL_STREAMS.includes(specialization) ? specialization : '';

  // Preset subjects based on context
  const presetSubjects = isCollege
    ? PRESET_SUBJECTS.College
    : showStream && activeStream
    ? PRESET_SUBJECTS[activeStream] || PRESET_SUBJECTS.Default
    : PRESET_SUBJECTS.Default;

  // ──────────────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleStreamSelect = (stream: string) => {
    setSpecialization(stream);
    // Reset subjects to stream defaults
    setSubjects([]);
  };

  const togglePresetSubject = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const addCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      setMessage({ type: 'error', text: `"${trimmed}" is already in your list.` });
      return;
    }
    setSubjects((prev) => [...prev, trimmed]);
    setCustomSubjectInput('');
    customInputRef.current?.focus();
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSubject();
    }
  };

  const removeSubject = (subject: string) => {
    setSubjects((prev) => prev.filter((s) => s !== subject));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const res = await updateProfile({
      fullName,
      age: age === '' ? undefined : Number(age),
      gender,
      educationLevel,
      degree,
      specialization,
      semester,
      schoolName,
      schoolCity,
      profilePic,
    });

    setIsSaving(false);
    if (res.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to update profile. Please try again.' });
    }
  };

  const getInitials = () => {
    const name = fullName || user.username;
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // ──────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-100 flex text-zinc-900 font-sans selection:bg-[#ff7a59] selection:text-white">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <div className="hidden md:flex">
        <Sidebar activeItem="settings" />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header — hidden on mobile */}
        <div className="hidden md:block">
          <Header title="Settings" showBackButton={true} backUrl="/" />
        </div>

        {/* ── MOBILE TOP BAR (floating white pill matching settings title/back action) ── */}
        <header className="flex md:hidden items-center justify-between mx-4 mt-4 mb-2 px-4 py-3 bg-white border border-zinc-200/60 rounded-[24px] shadow-sm sticky top-4 z-30">
          {/* Back button and page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-1.5 hover:bg-zinc-50 hover:text-zinc-800 rounded-lg transition-colors cursor-pointer text-zinc-500"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="font-extrabold text-zinc-900 text-lg tracking-tight">Settings</span>
          </div>
          
          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Bell */}
            <button className="relative w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center transition-colors hover:bg-zinc-100" aria-label="Notifications">
              <svg className="w-5 h-5 text-zinc-850" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ff7a59] rounded-full border border-white" />
            </button>
            
            {/* Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMobileProfileDropdown(!showMobileProfileDropdown)}
                className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 shadow-xs flex items-center justify-center flex-shrink-0 cursor-pointer"
                aria-label="Profile"
              >
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center font-extrabold text-[#ff7a59] text-sm">
                    {fullName
                      ? fullName.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
                      : user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {showMobileProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 border-b border-zinc-100">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Signed in as</p>
                    <p className="text-xs text-zinc-505 truncate">{user?.email}</p>
                    {fullName && (
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
            
            {/* Hamburger */}
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

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Page title */}
            <div className="mb-8 px-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">Account Settings</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Update your personal profile, education details, and subjects.
              </p>
            </div>
            
            {/* Alert banner */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-8 shadow-xs space-y-8">

              {/* ── AVATAR ── */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-100">
                <div className="relative group flex-shrink-0">
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-zinc-200 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center font-extrabold text-[#ff7a59] text-2xl">
                      {getInitials()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h3 className="text-sm font-bold text-zinc-900">Profile Picture</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">PNG, JPG or GIF · Max 2 MB</p>
                  <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start pt-1">
                    <label className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-full text-xs transition-colors cursor-pointer shadow-sm">
                      Upload Photo
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfilePic('')}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-full text-xs transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── PERSONAL INFO ── */}
              <div className="space-y-5">
                <SectionLabel>Personal Information</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldWrapper label="Full Name">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Karan Bhatt"
                      className={inputCls}
                    />
                  </FieldWrapper>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper label="Age">
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 17"
                        min={5} max={120}
                        className={inputCls}
                      />
                    </FieldWrapper>
                    <FieldWrapper label="Gender">
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectCls}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </FieldWrapper>
                  </div>
                </div>
              </div>

              {/* ── EDUCATION ── */}
              <div className="space-y-5 pt-4 border-t border-zinc-100">
                <SectionLabel>Education & Institution</SectionLabel>

                {/* Education level toggle */}
                <FieldWrapper label="Education Level">
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    {['School', 'College'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setEducationLevel(lvl);
                          setSpecialization('');
                          setSemester('');
                          setSubjects([]);
                        }}
                        className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                          educationLevel === lvl
                            ? 'bg-orange-50 border-[#ff7a59] text-[#ff7a59]'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                        }`}
                      >
                        {lvl === 'College' ? 'College / University' : 'School'}
                      </button>
                    ))}
                  </div>
                </FieldWrapper>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Grade / Degree */}
                  <FieldWrapper label={isCollege ? 'Degree / Programme' : 'Standard / Grade'}>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => {
                        setDegree(e.target.value);
                        // Reset stream/specialization when grade changes
                        if (!isCollege) setSpecialization('');
                      }}
                      placeholder={isCollege ? 'e.g. B.Tech, MBA, B.Sc' : 'e.g. 11th Grade, 12th Grade, 9th'}
                      className={inputCls}
                    />
                  </FieldWrapper>

                  {/* Stream — only for 11th / 12th */}
                  {showStream && (
                    <FieldWrapper label="Stream">
                      <div className="grid grid-cols-3 gap-2">
                        {SCHOOL_STREAMS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleStreamSelect(s)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              activeStream === s
                                ? 'bg-orange-50 border-[#ff7a59] text-[#ff7a59]'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </FieldWrapper>
                  )}

                  {/* College: Specialization */}
                  {isCollege && (
                    <FieldWrapper label="Specialization / Major">
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Computer Science, Finance, Biotechnology"
                        className={inputCls}
                      />
                    </FieldWrapper>
                  )}

                  {/* College: Semester */}
                  {isCollege && (
                    <FieldWrapper label="Current Semester">
                      <select value={semester} onChange={(e) => setSemester(e.target.value)} className={selectCls}>
                        <option value="">Select semester</option>
                        {COLLEGE_SEMESTERS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </FieldWrapper>
                  )}
                </div>

                {/* Institution fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldWrapper label="Institution Name">
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Delhi Public School"
                      className={inputCls}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Institution City">
                    <input
                      type="text"
                      value={schoolCity}
                      onChange={(e) => setSchoolCity(e.target.value)}
                      placeholder="e.g. Bokaro Steel City"
                      className={inputCls}
                    />
                  </FieldWrapper>
                </div>
              </div>



              {/* ── ACTIONS ── */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-3.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3.5 bg-[#ff7a59] hover:bg-[#fa6a47] disabled:opacity-60 text-white font-bold rounded-2xl shadow-md shadow-[#ff7a59]/20 active:scale-98 transition-all cursor-pointer text-xs flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar drawer overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
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
              <Sidebar activeItem="settings" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Small reusable sub-components
// ──────────────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-[#ff7a59] focus:ring-2 focus:ring-[#ff7a59]/10 rounded-2xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition-all font-medium';

const selectCls =
  'w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-[#ff7a59] focus:ring-2 focus:ring-[#ff7a59]/10 rounded-2xl px-4 py-3 text-sm text-zinc-900 transition-all cursor-pointer font-semibold';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{children}</h3>
  );
}

function FieldWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );
}
