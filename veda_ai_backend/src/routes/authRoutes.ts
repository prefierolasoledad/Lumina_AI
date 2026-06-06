import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  verifyOtp,
  resendOtp,
  updateUserProfile,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { otpAndResetLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', otpAndResetLimiter, registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/verify-otp', otpAndResetLimiter, verifyOtp);
router.post('/resend-otp', otpAndResetLimiter, resendOtp);
router.post('/refresh', refreshAccessToken);
router.post('/forgot-password', otpAndResetLimiter, forgotPassword);
router.post('/reset-password/:token', otpAndResetLimiter, resetPassword);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router;
