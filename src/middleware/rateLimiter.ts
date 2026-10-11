import rateLimit from 'express-rate-limit';

/**
 * Auth rate limiter — prevents brute-force attacks on login/register/OTP endpoints.
 * Allows 10 requests per IP per minute.
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in a moment.' },
});
