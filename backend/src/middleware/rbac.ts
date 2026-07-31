import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { UserRole } from '../constants';
import { hasAllPermissions, hasAnyPermission } from '../utils/permissions';

/**
 * Restricts access to users whose role is included in `roles`. Must run
 * after `authenticate`.
 */
export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden(`This action requires one of the following roles: ${roles.join(', ')}`);
    }
    next();
  };
}

interface PermissionOptions {
  /** If true, the user must have ALL listed permissions instead of ANY. */
  requireAll?: boolean;
}

/**
 * Restricts access to users holding the given permission(s). Admins with
 * a `module:manage` permission automatically satisfy any action within
 * that module. Must run after `authenticate`.
 */
export function requirePermissions(permissions: string | string[], options: PermissionOptions = {}) {
  const required = Array.isArray(permissions) ? permissions : [permissions];

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const granted = options.requireAll
      ? hasAllPermissions(req.user.permissions, required)
      : hasAnyPermission(req.user.permissions, required);

    if (!granted) {
      throw AppError.forbidden(`Missing required permission(s): ${required.join(', ')}`);
    }

    next();
  };
}

/** Allows access only if the authenticated user's id matches `paramName`, or they have the given override permission(s). */
export function requireSelfOrPermissions(paramName: string, permissions: string | string[]) {
  const required = Array.isArray(permissions) ? permissions : [permissions];

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const targetId = req.params[paramName];
    if (targetId && targetId === req.user.id) {
      return next();
    }

    if (hasAnyPermission(req.user.permissions, required)) {
      return next();
    }

    throw AppError.forbidden('You are not allowed to access this resource');
  };
}

export default { requireRoles, requirePermissions, requireSelfOrPermissions };
