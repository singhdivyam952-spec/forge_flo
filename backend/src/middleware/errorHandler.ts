import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';

/** 404 handler - placed after all routes to catch unmatched paths. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      (details[key] ??= []).push(issue.message);
    }
    return new AppError('Validation failed', 422, 'VALIDATION_ERROR', details);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details: Record<string, string> = {};
    for (const [key, value] of Object.entries(err.errors)) {
      details[key] = value.message;
    }
    return new AppError('Validation failed', 422, 'VALIDATION_ERROR', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid value for field '${err.path}'`, 400, 'CAST_ERROR');
  }

  if (isMongoServerError(err) && err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return new AppError(`Duplicate value for '${field}'. This ${field} already exists.`, 409, 'DUPLICATE_KEY', {
      field,
      value: err.keyValue?.[field],
    });
  }

  if (isJwtError(err)) {
    return new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }

  if (err instanceof Error && err.name === 'MulterError') {
    return new AppError(err.message, 400, 'UPLOAD_ERROR');
  }

  if (isBodyParserSyntaxError(err)) {
    return new AppError('Malformed JSON in request body', 400, 'INVALID_JSON');
  }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  return AppError.internal(isProduction ? 'Internal server error' : message);
}

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isMongoServerError(err: unknown): err is MongoDuplicateKeyError {
  return err instanceof Error && err.name === 'MongoServerError' && typeof (err as MongoDuplicateKeyError).code === 'number';
}

function isJwtError(err: unknown): boolean {
  return err instanceof Error && ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name);
}

function isBodyParserSyntaxError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as SyntaxError & { status?: number }).status === 400 &&
    'body' in err
  );
}

/** Global Express error-handling middleware. Must be registered last. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const appError = normalizeError(err);

  const logMeta = {
    method: req.method,
    path: req.originalUrl,
    statusCode: appError.statusCode,
    errorCode: appError.errorCode,
    userId: req.user?.id,
    ip: req.ip,
  };

  if (appError.statusCode >= 500) {
    logger.error(err instanceof Error ? err.stack ?? err.message : String(err), logMeta);
  } else {
    logger.warn(appError.message, logMeta);
  }

  ApiResponse.error(res, appError.message, appError.statusCode, appError.errorCode, appError.details);
}

export default errorHandler;
