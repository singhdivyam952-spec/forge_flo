import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

interface ErrorBody {
  success: false;
  message: string;
  errorCode?: string;
  errors?: unknown;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response {
    const body: SuccessBody<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message = 'Success',
    statusCode = 200
  ): Response {
    const body: SuccessBody<T[]> = {
      success: true,
      message,
      data,
      meta,
    };
    return res.status(statusCode).json(body);
  }

  static error(
    res: Response,
    message = 'Something went wrong',
    statusCode = 500,
    errorCode = 'INTERNAL_ERROR',
    errors?: unknown
  ): Response {
    const body: ErrorBody = {
      success: false,
      message,
      errorCode,
      errors,
    };
    return res.status(statusCode).json(body);
  }
}

export function buildPaginationMeta(page: number, limit: number, totalItems: number): PaginationMeta {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export default ApiResponse;
