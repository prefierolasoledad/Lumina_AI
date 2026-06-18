import { ApiResponse } from './api';

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  profilePic?: string;
  schoolName?: string;
  schoolCity?: string;
  age?: number;
  gender?: string;
  educationLevel?: string;
  degree?: string;
  specialization?: string;
  semester?: string;
  subjects?: string[];
  createdAt?: string;
  updatedAt?: string;
}

let API_BASE_URL = '/api';

export const authService = {
  /**
   * Register a new user
   */
  async register(username: string, email: string, password: string): Promise<ApiResponse<User> & { otpSent?: boolean; email?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include', // Ensure cookies are received and saved
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return { success: true, otpSent: true, email: data.email };
    } catch (error: any) {
      console.error('authService register error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  },

  /**
   * Log in user
   */
  async login(email: string, password: string): Promise<ApiResponse<User> & { unverified?: boolean; email?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Ensure cookies are received and saved
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Login failed',
          unverified: data.unverified || false,
          email: data.email,
        };
      }

      return { success: true, data: data.user };
    } catch (error: any) {
      console.error('authService login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  },

  /**
   * Log out user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are cleared
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
      }

      return { success: true };
    } catch (error: any) {
      console.error('authService logout error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  },

  /**
   * Get logged-in user profile (for session persistence)
   * Must include credentials to pass the token cookie.
   */
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      let response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent
      });

      if (response.status === 401) {
        const refreshResult = await this.refresh();
        if (refreshResult.success) {
          response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            credentials: 'include',
          });
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user profile');
      }

      return { success: true, data: data.user };
    } catch (error: any) {
      // Don't log normal unauthenticated profile fetches as critical errors
      return {
        success: false,
        error: error.message || 'Unauthenticated',
      };
    }
  },

  /**
   * Verify registration OTP
   */
  async verifyOtp(email: string, otp: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
        credentials: 'include', // Ensure cookies are received and saved on success
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      return { success: true, data: data.user };
    } catch (error: any) {
      console.error('authService verifyOtp error:', error);
      return {
        success: false,
        error: error.message || 'OTP verification failed',
      };
    }
  },

  /**
   * Resend verification OTP
   */
  async resendOtp(email: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      return { success: true };
    } catch (error: any) {
      console.error('authService resendOtp error:', error);
      return {
        success: false,
        error: error.message || 'Failed to resend OTP',
      };
    }
  },

  /**
   * Update user profile settings
   */
  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include', // Pass cookies to authorize
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return { success: true, data: data.user };
    } catch (error: any) {
      console.error('authService updateProfile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  },

  /**
   * Request a password reset email
   */
  async forgotPassword(email: string): Promise<ApiResponse<void> & { message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      console.error('authService forgotPassword error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reset email',
      };
    }
  },

  /**
   * Reset the password using the token from the email link
   */
  async resetPassword(token: string, password: string): Promise<ApiResponse<void> & { message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      console.error('authService resetPassword error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset password',
      };
    }
  },

  /**
   * Refresh the access token
   */
  async refresh(): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Token refresh failed',
      };
    }
  },
};
