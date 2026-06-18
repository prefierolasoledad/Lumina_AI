import rateLimit from 'express-rate-limit';

// Limit OTP generation / Verification and Password reset operations
// Allow only 5 requests per 15 minutes per IP
export const otpAndResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Throttle AI Toolkit generations to protect Gemini quota from abuse.
export const toolkitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    success: false,
    error: 'Too many AI requests. Please slow down and try again shortly.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Throttle login attempts to slow down password brute-forcing.
// Allow 10 attempts per 15 minutes per IP.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
