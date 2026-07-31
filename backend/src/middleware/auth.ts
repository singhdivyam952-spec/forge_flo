import { NextFunction, Request, Response } from 'express';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyAccessToken } from '../utils/tokens';
import { User } from '../models/User';
import { computeEffectivePermissions } from '../utils/permissions';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken as string;
  }
  return null;
}

/**
 * Verifies the JWT access token from the `Authorization` header (or
 * `accessToken` cookie), loads the current user, and attaches a minimal
 * `req.user` object for downstream authorization checks.
 */
export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    throw AppError.unauthorized('Authentication token is missing');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AppError('Access token has expired', 401, 'TOKEN_EXPIRED');
    }
    if (error instanceof JsonWebTokenError) {
      throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
    }
    throw AppError.unauthorized('Failed to authenticate token');
  }

  const user = await User.findById(decoded.sub).lean();

  if (!user) {
    throw AppError.unauthorized('User belonging to this token no longer exists');
  }

  if (!user.isActive) {
    throw AppError.forbidden('This account has been deactivated');
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw AppError.forbidden('This account is temporarily locked');
  }

  req.user = {
    id: String(user._id),
    email: user.email,
    role: user.role,
    permissions: computeEffectivePermissions(user.role, user.additionalPermissions, user.revokedPermissions),
  };

  next();
});

/**
 * Like `authenticate`, but does not throw if no token is present -
 * useful for endpoints that behave differently for guests vs logged-in
 * users without requiring auth.
 */
export const optionalAuthenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).lean();
    if (user && user.isActive) {
      req.user = {
        id: String(user._id),
        email: user.email,
        role: user.role,
        permissions: computeEffectivePermissions(user.role, user.additionalPermissions, user.revokedPermissions),
      };
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
});

export default authenticate;
