import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { ApiResponse } from '../utils/apiResponse';

function rateLimitHandler(req: Request, res: Response): void {
  ApiResponse.error(
    res,
    'Too many requests, please try again later.',
    429,
    'TOO_MANY_REQUESTS'
  );
}

/** General purpose limiter applied globally to the API. */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/** Stricter limiter for authentication endpoints to slow down brute force attempts. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler,
  message: 'Too many authentication attempts, please try again later.',
});

/** Very strict limiter for password reset / forgot password endpoints. */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/** Loose limiter for read-heavy report/export endpoints. */
export const reportRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
}

export default globalRateLimiter;
