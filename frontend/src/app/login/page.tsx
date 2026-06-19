'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
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

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register, verifyOtp, resendOtp, loading } = useAuth();
  
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Forgot Password States
  const [showForgotScreen, setShowForgotScreen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');

  // If already logged in, redirect to home page
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpScreen && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, showOtpScreen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { username, email, password, confirmPassword } = formData;

    // Validate email format on both login and register
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (isLoginTab) {
      // Login validation
      if (!email || !password) {
        setErrorMsg('Please fill in all fields.');
        return;
      }

      setFormLoading(true);
      const res = await login(email, password);
      setFormLoading(false);

      if (res.success) {
        router.push('/');
      } else if (res.unverified) {
        // Redirect user to OTP verification if email is unverified
        setOtpEmail(res.email || email);
        setErrorMsg('');
        setCountdown(30);
        setCanResend(false);
        setShowOtpScreen(true);
      } else {
        setErrorMsg(res.error || 'Invalid credentials');
      }
    } else {
      // Register validation
      if (!username || !email || !password || !confirmPassword) {
        setErrorMsg('Please fill in all fields.');
        return;
      }

      // Enforce strong password criteria (must meet all 5 requirements)
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
      const res = await register(username, email, password);
      setFormLoading(false);

      if (res.success && res.otpSent) {
        setOtpEmail(res.email || email);
        setErrorMsg('');
        setCountdown(30);
        setCanResend(false);
        setShowOtpScreen(true);
      } else {
        setErrorMsg(res.error || 'Registration failed');
      }
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccess('');

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(forgotEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setFormLoading(true);
    const result = await authService.forgotPassword(forgotEmail);
    setFormLoading(false);

    if (result.success) {
      // Backend returns a generic message regardless of whether the email exists
      setForgotSuccess(result.message || 'If an account exists for that email, a reset link has been sent.');
    } else {
      setErrorMsg(result.error || 'Failed to send reset email. Please try again.');
    }
  };

  // OTP input handling logic
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otpCode];
    newOtp[index] = value.substring(value.length - 1);
    setOtpCode(newOtp);
    setErrorMsg('');

    // Focus next input automatically
    if (value !== '' && element.nextElementSibling) {
      (element.nextElementSibling as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpCode];
      // If current is empty, clear previous, focus it
      if (otpCode[index] === '' && index > 0) {
        newOtp[index - 1] = '';
        setOtpCode(newOtp);
        const prevInput = e.currentTarget.previousElementSibling as HTMLInputElement;
        if (prevInput) prevInput.focus();
      } else {
        newOtp[index] = '';
        setOtpCode(newOtp);
      }
      setErrorMsg('');
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtpCode(newOtp);
    setErrorMsg('');

    // Focus last input
    const container = e.currentTarget.parentElement;
    if (container) {
      const inputs = container.querySelectorAll('input');
      inputs[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setOtpSuccess('');
    const fullOtp = otpCode.join('');

    if (fullOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit code.');
      return;
    }

    setFormLoading(true);
    const result = await verifyOtp(otpEmail, fullOtp);
    setFormLoading(false);

    if (result.success) {
      router.push('/');
    } else {
      setErrorMsg(result.error || 'Invalid or expired OTP code.');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setOtpSuccess('');

    setFormLoading(true);
    const result = await resendOtp(otpEmail);
    setFormLoading(false);

    if (result.success) {
      setOtpSuccess('A new verification code has been sent!');
      setCountdown(30);
      setCanResend(false);
      setOtpCode(Array(6).fill(''));
    } else {
      setErrorMsg(result.error || 'Failed to resend verification code');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-50">
        <Logo size="md" href="/" />
      </header>

      {/* Main Authentication Area */}
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
          {(otpSuccess || forgotSuccess) && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2 relative z-10 font-semibold">
              <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{otpSuccess || forgotSuccess}</span>
            </div>
          )}

          {showForgotScreen ? (
            /* Forgot Password Panel */
            <>
              <div className="text-center mb-6 relative z-10">
                <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">
                  Reset Password
                </h2>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed font-semibold">
                  Enter your account email and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="forgotEmail"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all duration-200 text-sm font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full mt-2 py-3 px-6 bg-gradient-to-r from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] hover:opacity-95 text-white font-bold rounded-full border-none shadow-md shadow-[#ff7a59]/10 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {formLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="flex justify-center pt-2 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotScreen(false);
                      setErrorMsg('');
                      setForgotSuccess('');
                    }}
                    className="mt-3 text-zinc-550 hover:text-zinc-900 transition-colors cursor-pointer font-bold text-xs"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          ) : !showOtpScreen ? (
            /* Authentication Panel */
            <>
              {/* Heading */}
              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">
                  Welcome to Lumina AI
                </h2>
                <p className="text-zinc-400 text-xs font-semibold mt-2">
                  {isLoginTab ? 'Sign in to generate questions' : 'Create an account to get started'}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 mb-6 relative z-10">
                <button
                  onClick={() => {
                    setIsLoginTab(true);
                    setErrorMsg('');
                    setOtpSuccess('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    isLoginTab
                      ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/50'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsLoginTab(false);
                    setErrorMsg('');
                    setOtpSuccess('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    !isLoginTab
                      ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/50'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {!isLoginTab && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="john_doe"
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all duration-200 text-sm font-semibold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all duration-200 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all duration-200 text-sm font-semibold"
                  />
                  {!isLoginTab && formData.password.length > 0 && (
                    <div className="mt-3 space-y-2 animate-fadeIn">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400 font-bold">Password Strength:</span>
                        <span className={`font-bold ${getPasswordStrength(formData.password).textClass}`}>
                          {getPasswordStrength(formData.password).label}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 h-1 w-full bg-zinc-100 rounded-full overflow-hidden p-0">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-full rounded-full transition-all duration-300 ${
                              i < getPasswordStrength(formData.password).score
                                ? getPasswordStrength(formData.password).colorClass
                                : 'bg-zinc-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[10px] font-bold">
                        {getPasswordStrength(formData.password).criteria.map((c, idx) => (
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

                {isLoginTab && (
                  <div className="text-right -mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotScreen(true);
                        setForgotEmail(formData.email);
                        setErrorMsg('');
                        setOtpSuccess('');
                        setForgotSuccess('');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {!isLoginTab && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl text-zinc-900 placeholder-zinc-400 transition-all duration-200 text-sm font-semibold"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] hover:opacity-95 text-white font-bold rounded-full border-none shadow-md shadow-[#ff7a59]/10 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {formLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : isLoginTab ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* OTP Verification Panel */
            <>
              {/* Heading */}
              <div className="text-center mb-6 relative z-10">
                <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">
                  Verify Account
                </h2>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed font-semibold">
                  We have sent a 6-digit code to <span className="font-bold text-zinc-850">{otpEmail}</span>. Enter it below to complete verification.
                </p>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleOtpSubmit} className="space-y-6 relative z-10">
                <div className="flex justify-between gap-2.5" onPaste={handleOtpPaste}>
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.currentTarget, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      required
                      className="w-12 h-14 text-center bg-zinc-55 border border-zinc-200 hover:border-zinc-300 rounded-2xl text-xl font-bold text-indigo-600 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-150"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] hover:opacity-95 text-white font-bold rounded-full border-none shadow-md shadow-[#ff7a59]/10 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {formLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    'Verify & Log In'
                  )}
                </button>

                <div className="flex flex-col items-center gap-3 text-xs text-zinc-500 pt-2 border-t border-zinc-200">
                  <div className="font-semibold text-zinc-500">
                    Didn&apos;t receive code?{' '}
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-indigo-650 hover:text-indigo-800 font-bold cursor-pointer underline hover:no-underline transition-colors"
                      >
                        Resend Code
                      </button>
                    ) : (
                      <span>Resend in <span className="font-bold text-zinc-800">{countdown}s</span></span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpScreen(false);
                      setErrorMsg('');
                      setOtpSuccess('');
                      setOtpCode(Array(6).fill(''));
                    }}
                    className="text-zinc-550 hover:text-zinc-900 transition-colors cursor-pointer font-bold"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-450 font-semibold bg-white/40">
        &copy; {new Date().getFullYear()} Lumina AI. Secure OTP verification.
      </footer>
    </div>
  );
}
