import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async Express route/middleware handler so any rejected promise
 * is forwarded to `next()` and handled by the global error handler.
 * `express-async-errors` also patches this globally, but keeping an
 * explicit wrapper makes intent obvious and works even without that patch.
 */
export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response
>(
  fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown> | unknown
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
}

export default asyncHandler;
