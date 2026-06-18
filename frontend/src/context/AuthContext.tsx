'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; unverified?: boolean; email?: string; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; otpSent?: boolean; email?: string; error?: string }>;
  logout: () => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (profileData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  checkUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user session exists (cookie-based profile fetch)
  const checkUserSession = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();

    const handleUnauthorized = () => {
      setUser(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unauthorized', handleUnauthorized);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unauthorized', handleUnauthorized);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const result = await authService.login(email, password);
    if (result.success && result.data) {
      setUser(result.data);
      setLoading(false);
      return { success: true };
    } else {
      setUser(null);
      setLoading(false);
      return {
        success: false,
        unverified: result.unverified,
        email: result.email,
        error: result.error,
      };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    const result = await authService.register(username, email, password);
    setLoading(false);
    if (result.success && result.otpSent) {
      return { success: true, otpSent: true, email: result.email };
    } else {
      return { success: false, error: result.error };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);
    const result = await authService.verifyOtp(email, otp);
    if (result.success && result.data) {
      setUser(result.data);
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: result.error };
    }
  };

  const resendOtp = async (email: string) => {
    const result = await authService.resendOtp(email);
    return { success: result.success, error: result.error };
  };

  const updateProfile = async (profileData: Partial<User>) => {
    setLoading(true);
    const result = await authService.updateProfile(profileData);
    if (result.success && result.data) {
      setUser(result.data);
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: result.error };
    }
  };

  const logout = async () => {
    setLoading(true);
    await authService.logout();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        verifyOtp,
        resendOtp,
        updateProfile,
        checkUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
