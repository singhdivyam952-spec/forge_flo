import { NextFunction, Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuditAction } from '../constants';
import { logger } from '../config/logger';

export interface AuditOptions {
  action: AuditAction;
  module: string;
  entityType?: string;
  /** Extracts the entity id from the request (params/body) once the handler has run. */
  getEntityId?: (req: Request, res: Response) => string | undefined;
  /** Builds a human readable description for the log entry. */
  getDescription?: (req: Request, res: Response) => string | undefined;
}

/**
 * Records an audit trail entry after the response has been sent, capturing
 * who did what, when, and from where. Never blocks or fails the request -
 * logging errors are swallowed and reported via the logger instead.
 */
export function audit(options: AuditOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.once('finish', () => {
      if (res.statusCode >= 400) return;

      const entry = {
        user: req.user?.id,
        userSnapshot: req.user
          ? { name: req.user.email, email: req.user.email, role: req.user.role }
          : undefined,
        action: options.action,
        module: options.module,
        entityType: options.entityType,
        entityId: options.getEntityId?.(req, res),
        description: options.getDescription?.(req, res),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
      };

      AuditLog.create(entry).catch((error) => {
        logger.error('Failed to write audit log', { error: (error as Error).message, entry });
      });
    });

    next();
  };
}

function mapMethodToAction(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'POST':
      return AuditAction.Create;
    case 'PUT':
    case 'PATCH':
      return AuditAction.Update;
    case 'DELETE':
      return AuditAction.Delete;
    default:
      return AuditAction.Other;
  }
}

/**
 * Generic request logger for audit purposes that doesn't require explicit
 * per-route action configuration - infers the action from the HTTP method.
 * Useful as a catch-all on sensitive routers.
 */
export function auditRequest(module: string, entityType?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    audit({ action: mapMethodToAction(req.method), module, entityType })(req, res, next);
  };
}

export default audit;
