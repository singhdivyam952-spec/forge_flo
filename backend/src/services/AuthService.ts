import crypto from 'crypto';
import { IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { userRepository } from '../repositories/UserRepository';
import { AppError } from '../utils/AppError';
import { comparePassword, hashPassword, validatePasswordStrength } from '../utils/password';
import {
  expiresInToDate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens';
import { computeEffectivePermissions } from '../utils/permissions';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { UserRole } from '../constants';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export interface RegisterInput {
  employeeCode: string;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  designation?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

export type SafeUser = Omit<IUser, 'password' | 'refreshTokens' | 'comparePassword'> & { permissions: string[] };

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function toSafeUser(user: IUser): SafeUser {
  const obj = user.toObject({ virtuals: true }) as Record<string, unknown>;
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;

  return {
    ...(obj as unknown as Omit<IUser, 'password' | 'refreshTokens' | 'comparePassword'>),
    permissions: computeEffectivePermissions(user.role, user.additionalPermissions, user.revokedPermissions),
  };
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const emailTaken = await userRepository.emailExists(input.email);
    if (emailTaken) {
      throw AppError.conflict('An account with this email already exists');
    }

    const codeTaken = await userRepository.findByEmployeeCode(input.employeeCode);
    if (codeTaken) {
      throw AppError.conflict('An account with this employee code already exists');
    }

    const strength = validatePasswordStrength(input.password);
    if (!strength.valid) {
      throw AppError.unprocessable('Password does not meet strength requirements', strength.reasons);
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await userRepository.create({
      employeeCode: input.employeeCode.toUpperCase().trim(),
      firstName: input.firstName.trim(),
      lastName: (input.lastName ?? '').trim(),
      email: input.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: input.phone,
      role: input.role ?? UserRole.Viewer,
      department: input.department,
      designation: input.designation,
      passwordChangedAt: new Date(),
    } as Partial<IUser>);

    logger.info('New user registered', { userId: String(user._id), email: user.email });

    const tokens = await this.issueTokens(user);

    return { user: toSafeUser(user), tokens };
  }

  async login(input: LoginInput, meta: RequestMeta = {}): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email, true);

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw AppError.forbidden(`Account is locked due to repeated failed logins. Try again in ${minutesLeft} minute(s).`);
    }

    if (!user.isActive) {
      throw AppError.forbidden('This account has been deactivated. Contact your administrator.');
    }

    const passwordMatches = await comparePassword(input.password, user.password);

    if (!passwordMatches) {
      await this.registerFailedLogin(user);
      throw AppError.unauthorized('Invalid email or password');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    user.lastLoginIp = meta.ip;
    await user.save();

    const tokens = await this.issueTokens(user, meta);

    logger.info('User logged in', { userId: String(user._id), email: user.email });

    return { user: toSafeUser(user), tokens };
  }

  async refresh(refreshTokenValue: string, meta: RequestMeta = {}): Promise<AuthTokens> {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshTokenValue);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const storedToken = await RefreshToken.findOne({ jti: decoded.jti }).exec();

    if (!storedToken || storedToken.revoked || storedToken.expiresAt.getTime() < Date.now()) {
      throw AppError.unauthorized('Refresh token is no longer valid. Please log in again.');
    }

    if (storedToken.hashedToken !== hashToken(refreshTokenValue)) {
      throw AppError.unauthorized('Refresh token mismatch');
    }

    const user = await userRepository.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User account is no longer available');
    }

    storedToken.revoked = true;
    storedToken.revokedAt = new Date();

    const tokens = await this.issueTokens(user, meta);

    storedToken.replacedByJti = extractJtiFromToken(tokens.refreshToken);
    await storedToken.save();

    user.refreshTokens = user.refreshTokens.filter((rt) => rt.jti !== decoded.jti);
    await user.save();

    return tokens;
  }

  async logout(userId: string, refreshTokenValue?: string): Promise<void> {
    if (refreshTokenValue) {
      try {
        const decoded = verifyRefreshToken(refreshTokenValue);
        await RefreshToken.updateOne({ jti: decoded.jti }, { revoked: true, revokedAt: new Date() }).exec();
        await userRepository.updateById(userId, { $pull: { refreshTokens: { jti: decoded.jti } } });
        return;
      } catch {
        // Token already invalid/expired - nothing to revoke, fall through silently.
        return;
      }
    }

    await this.logoutAll(userId);
  }

  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.updateMany({ user: userId, revoked: false }, { revoked: true, revokedAt: new Date() }).exec();
    await userRepository.updateById(userId, { refreshTokens: [] });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const matches = await comparePassword(currentPassword, user.password);
    if (!matches) {
      throw AppError.unauthorized('Current password is incorrect');
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      throw AppError.unprocessable('Password does not meet strength requirements', strength.reasons);
    }

    user.password = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    await this.logoutAll(userId);

    logger.info('User changed password', { userId });
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId, { populate: [{ path: 'reportingManager', select: 'firstName lastName email' }] });
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return toSafeUser(user);
  }

  private async issueTokens(user: IUser, meta: RequestMeta = {}): Promise<AuthTokens> {
    const permissions = computeEffectivePermissions(user.role, user.additionalPermissions, user.revokedPermissions);

    const accessToken = generateAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
      permissions,
    });

    const { token: refreshTokenValue, jti } = generateRefreshToken(String(user._id));
    const refreshTokenExpiresAt = expiresInToDate(env.JWT_REFRESH_EXPIRES);

    await RefreshToken.create({
      user: user._id,
      jti,
      hashedToken: hashToken(refreshTokenValue),
      expiresAt: refreshTokenExpiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });

    user.refreshTokens.push({
      jti,
      expiresAt: refreshTokenExpiresAt,
      createdAt: new Date(),
      userAgent: meta.userAgent,
      ip: meta.ip,
    });

    // Cap stored session metadata to the most recent 10 sessions per user.
    if (user.refreshTokens.length > 10) {
      user.refreshTokens = user.refreshTokens.slice(-10);
    }

    await user.save();

    return { accessToken, refreshToken: refreshTokenValue, refreshTokenExpiresAt };
  }

  private async registerFailedLogin(user: IUser): Promise<void> {
    user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      logger.warn('User account locked due to repeated failed logins', { userId: String(user._id) });
    }

    await user.save();
  }
}

function extractJtiFromToken(token: string): string {
  const decoded = verifyRefreshToken(token);
  return decoded.jti;
}

export const authService = new AuthService();

export default authService;
