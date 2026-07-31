import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { authService, AuthTokens } from '../services/AuthService';
import { AppError } from '../utils/AppError';
import { COOKIE_NAMES } from '../constants';
import { isProduction } from '../config/env';
import {
  ChangePasswordSchema,
  LoginSchema,
  LogoutSchema,
  RefreshTokenSchema,
  RegisterSchema,
} from '../validators/auth.validators';

function setRefreshTokenCookie(res: Response, tokens: AuthTokens): void {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: tokens.refreshTokenExpiresAt,
    path: '/api/v1/auth',
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: '/api/v1/auth' });
}

function extractRefreshToken(req: Request): string | undefined {
  const bodyToken = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  const cookieToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
  return bodyToken || cookieToken;
}

function getRequestMeta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

export class AuthController {
  register = asyncHandler(async (req: Request<any, any, RegisterSchema>, res: Response) => {
    const { user, tokens } = await authService.register(req.body);
    setRefreshTokenCookie(res, tokens);
    return ApiResponse.created(res, { user, accessToken: tokens.accessToken }, 'Account created successfully');
  });

  login = asyncHandler(async (req: Request<any, any, LoginSchema>, res: Response) => {
    const { user, tokens } = await authService.login(req.body, getRequestMeta(req));
    setRefreshTokenCookie(res, tokens);
    return ApiResponse.success(res, { user, accessToken: tokens.accessToken }, 'Logged in successfully');
  });

  refresh = asyncHandler(async (req: Request<any, any, RefreshTokenSchema>, res: Response) => {
    const refreshTokenValue = extractRefreshToken(req);
    if (!refreshTokenValue) {
      throw AppError.unauthorized('Refresh token is missing');
    }

    const tokens = await authService.refresh(refreshTokenValue, getRequestMeta(req));
    setRefreshTokenCookie(res, tokens);
    return ApiResponse.success(res, { accessToken: tokens.accessToken }, 'Token refreshed successfully');
  });

  logout = asyncHandler(async (req: Request<any, any, LogoutSchema>, res: Response) => {
    const refreshTokenValue = extractRefreshToken(req);
    if (req.user) {
      await authService.logout(req.user.id, refreshTokenValue);
    }
    clearRefreshTokenCookie(res);
    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }
    await authService.logoutAll(req.user.id);
    clearRefreshTokenCookie(res);
    return ApiResponse.success(res, null, 'Logged out from all devices successfully');
  });

  changePassword = asyncHandler(async (req: Request<any, any, ChangePasswordSchema>, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    clearRefreshTokenCookie(res);
    return ApiResponse.success(res, null, 'Password changed successfully. Please log in again.');
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }
    const user = await authService.me(req.user.id);
    return ApiResponse.success(res, { user }, 'Current user fetched successfully');
  });
}

export const authController = new AuthController();

export default authController;
