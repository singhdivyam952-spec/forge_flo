import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { UserRole } from '../constants';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
  tokenType: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tokenType: 'refresh';
}

export interface DecodedAccessToken extends AccessTokenPayload {
  iat: number;
  exp: number;
}

export interface DecodedRefreshToken extends RefreshTokenPayload {
  iat: number;
  exp: number;
}

export function generateAccessToken(payload: Omit<AccessTokenPayload, 'tokenType'>): string {
  const body: AccessTokenPayload = { ...payload, tokenType: 'access' };
  return jwt.sign(body, env.JWT_ACCESS_SECRET as Secret, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  } as SignOptions);
}

export interface GeneratedRefreshToken {
  token: string;
  jti: string;
}

export function generateRefreshToken(userId: string): GeneratedRefreshToken {
  const jti = uuidv4();
  const body: RefreshTokenPayload = { sub: userId, jti, tokenType: 'refresh' };
  const token = jwt.sign(body, env.JWT_REFRESH_SECRET as Secret, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  } as SignOptions);
  return { token, jti };
}

export function verifyAccessToken(token: string): DecodedAccessToken {
  return jwt.verify(token, env.JWT_ACCESS_SECRET as Secret) as DecodedAccessToken;
}

export function verifyRefreshToken(token: string): DecodedRefreshToken {
  return jwt.verify(token, env.JWT_REFRESH_SECRET as Secret) as DecodedRefreshToken;
}

export function decodeToken<T = unknown>(token: string): T | null {
  return jwt.decode(token) as T | null;
}

/**
 * Converts a JWT `expiresIn` style string (e.g. `7d`, `15m`) into a future
 * Date object, useful for persisting expiry alongside a hashed token.
 */
export function expiresInToDate(expiresIn: string): Date {
  const match = /^(\d+)\s*(ms|s|m|h|d|w|y)?$/i.exec(expiresIn.trim());
  const now = new Date();

  if (!match) {
    return new Date(now.getTime() + 15 * 60 * 1000);
  }

  const value = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();

  const unitToMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };

  const ms = value * (unitToMs[unit] ?? 1000);
  return new Date(now.getTime() + ms);
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  expiresInToDate,
};
