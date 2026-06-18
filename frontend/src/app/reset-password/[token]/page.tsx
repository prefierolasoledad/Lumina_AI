'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';
import Logo from '@/components/Logo';

interface StrengthCriteria {
  label: string;
  met: boolean;
}

const getPasswordStrength = (password: string) => {
  const criteria: StrengthCriteria[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
    { label: 'At least one number', met: /[0-9]/.test(password) },
    { label: 'At least one special char', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  let label = 'Weak';
  let colorClass = 'bg-red-500';
  let textClass = 'text-red-400';

  if (score >= 4) {
    label = 'Strong';
    colorClass = 'bg-emerald-500';
    textClass = 'text-emerald-400';
  } else if (score >= 2) {
    label = 'Medium';
    colorClass = 'bg-amber-500';
    textClass = 'text-amber-400';
  }

  return { score, criteria, label, colorClass, textClass };
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const strength = getPasswordStrength(password);
    if (strength.score < 5) {
      setErrorMsg('Password is too weak. Please satisfy all strength criteria below.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setFormLoading(true);
    const result = await authService.resetPassword(token, password);
    setFormLoading(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Password reset successful! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } else {
      setErrorMsg(result.error || 'Invalid or expired reset link. Please request a new one.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-50">
        <Logo size="md" href="/" />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white border border-zinc-200 shadow-xl rounded-3xl p-8 relative overflow-hidden">
          {/* Soft background glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2 animate-pulse relative z-10 font-semibold">
              <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message Box */}
          {successMsg && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2 relative z-10 font-semibold">
              <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Heading */}
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">Set a New Password</h2>
            <p className="text-zinc-400 text-xs font-semibold mt-2">
              Choose a strong password for your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all duration-200 text-sm font-semibold"
              />
              {password.length > 0 && (
                <div className="mt-3 space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-bold">Password Strength:</span>
                    <span className={`font-bold ${getPasswordStrength(password).textClass}`}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-1 w-full bg-zinc-100 rounded-full overflow-hidden p-0">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-full rounded-full transition-all duration-300 ${
                          i < getPasswordStrength(password).score
                            ? getPasswordStrength(password).colorClass
                            : 'bg-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[10px] font-bold">
                    {getPasswordStrength(password).criteria.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span
                          className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                            c.met ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                        />
                        <span className={c.met ? 'text-zinc-700' : 'text-zinc-400'}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all duration-200 text-sm font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading || !!successMsg}
              className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] hover:opacity-95 text-white font-bold rounded-full border-none shadow-md shadow-[#ff7a59]/10 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              {formLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Resetting...</span>
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="flex justify-center pt-2 border-t border-zinc-200">
              <Link
                href="/login"
                className="mt-3 text-zinc-550 hover:text-zinc-900 transition-colors cursor-pointer font-bold text-xs"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-450 font-semibold bg-white/40">
        &copy; {new Date().getFullYear()} Lumina AI. Secure password reset.
      </footer>
    </div>
  );
}
