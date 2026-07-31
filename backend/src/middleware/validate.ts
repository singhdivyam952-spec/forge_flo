import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError';

export type ValidationTarget = 'body' | 'query' | 'params';

interface ValidateSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!formatted[key]) formatted[key] = [];
    formatted[key].push(issue.message);
  }
  return formatted;
}

/**
 * Validates `req.body`, `req.query`, and/or `req.params` against the
 * provided zod schemas, replacing the parsed (and coerced/defaulted)
 * values back onto the request. Throws a 422 `AppError` with field-level
 * details on failure.
 */
export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        Object.assign(req.query, parsedQuery);
      }
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        Object.assign(req.params, parsedParams);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(AppError.unprocessable('Validation failed', formatZodError(error)));
      }
      next(error);
    }
  };
}

export function validateBody(schema: ZodTypeAny) {
  return validate({ body: schema });
}

export function validateQuery(schema: ZodTypeAny) {
  return validate({ query: schema });
}

export function validateParams(schema: ZodTypeAny) {
  return validate({ params: schema });
}

export default validate;
