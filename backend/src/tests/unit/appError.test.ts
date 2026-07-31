import { describe, it, expect } from 'vitest';
import { AppError } from '../../utils/AppError';

describe('AppError', () => {
  it('sets sensible defaults on the base constructor', () => {
    const error = new AppError('Something broke');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Something broke');
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe('INTERNAL_ERROR');
    expect(error.isOperational).toBe(true);
    expect(error.details).toBeUndefined();
    expect(error.name).toBe('AppError');
  });

  it('accepts a custom status code, error code and details payload', () => {
    const details = { field: 'email' };
    const error = new AppError('Custom failure', 418, 'IM_A_TEAPOT', details);

    expect(error.statusCode).toBe(418);
    expect(error.errorCode).toBe('IM_A_TEAPOT');
    expect(error.details).toBe(details);
  });

  describe('badRequest', () => {
    it('builds a 400 error with default message', () => {
      const error = AppError.badRequest();
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('BAD_REQUEST');
      expect(error.message).toBe('Bad request');
    });

    it('accepts a custom message and details', () => {
      const error = AppError.badRequest('Invalid payload', { reason: 'missing field' });
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid payload');
      expect(error.details).toEqual({ reason: 'missing field' });
    });
  });

  describe('unauthorized', () => {
    it('builds a 401 error', () => {
      const error = AppError.unauthorized();
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Unauthorized');
    });
  });

  describe('forbidden', () => {
    it('builds a 403 error', () => {
      const error = AppError.forbidden();
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('FORBIDDEN');
      expect(error.message).toBe('Forbidden');
    });
  });

  describe('notFound', () => {
    it('builds a 404 error with default message', () => {
      const error = AppError.notFound();
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });

    it('accepts a custom resource message', () => {
      const error = AppError.notFound('Production order not found');
      expect(error.message).toBe('Production order not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('conflict', () => {
    it('builds a 409 error', () => {
      const error = AppError.conflict('Duplicate document number');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe('CONFLICT');
      expect(error.message).toBe('Duplicate document number');
    });
  });

  describe('unprocessable', () => {
    it('builds a 422 error', () => {
      const error = AppError.unprocessable();
      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('UNPROCESSABLE_ENTITY');
      expect(error.message).toBe('Unprocessable entity');
    });
  });

  describe('tooManyRequests', () => {
    it('builds a 429 error', () => {
      const error = AppError.tooManyRequests();
      expect(error.statusCode).toBe(429);
      expect(error.errorCode).toBe('TOO_MANY_REQUESTS');
      expect(error.message).toBe('Too many requests');
    });
  });

  describe('internal', () => {
    it('builds a 500 error', () => {
      const error = AppError.internal();
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Internal server error');
    });
  });

  it('captures a stack trace pointing at the throwing code', () => {
    function throwIt(): never {
      throw AppError.badRequest('boom');
    }

    try {
      throwIt();
      expect.unreachable('throwIt should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).stack).toContain('AppError');
    }
  });
});
