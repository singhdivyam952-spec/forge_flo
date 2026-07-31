/**
 * Base application error. All operational errors thrown intentionally
 * within the codebase should extend or use this class so the global
 * error handler can distinguish them from unexpected programming errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized', details?: unknown): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message = 'Forbidden', details?: unknown): AppError {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message = 'Resource not found', details?: unknown): AppError {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static conflict(message = 'Conflict', details?: unknown): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static unprocessable(message = 'Unprocessable entity', details?: unknown): AppError {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }

  static tooManyRequests(message = 'Too many requests', details?: unknown): AppError {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS', details);
  }

  static internal(message = 'Internal server error', details?: unknown): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }
}

export default AppError;
