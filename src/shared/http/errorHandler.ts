import type { Request, Response, NextFunction } from 'express';
import { DomainError } from '../errors/DomainError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof DomainError) {
    return res.status(err.httpStatus).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // eslint-disable-next-line no-console
  console.error('Unexpected error:', err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.'
    }
  });
}

